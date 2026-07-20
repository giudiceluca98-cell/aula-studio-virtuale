"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface RemoteAudioStream {
  userId: string;
  stream: MediaStream;
}

type AudioConnectionState = "idle" | "connecting" | "connected" | "error";

interface UseAudioCallOptions {
  roomId: string;
  callId: string | null;
  currentUserId: string;
  joined: boolean;
  peerIds: string[];
  muted: boolean;
  enabled: boolean;
  client: SupabaseClient | null;
  onError?: (message: string) => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function useAudioCall({
  roomId,
  callId,
  currentUserId,
  joined,
  peerIds,
  muted,
  enabled,
  client,
  onError,
}: UseAudioCallOptions) {
  const [remoteStreams, setRemoteStreams] = useState<RemoteAudioStream[]>([]);
  const [microphoneReady, setMicrophoneReady] = useState(false);
  const [connectionState, setConnectionState] = useState<AudioConnectionState>("idle");
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingCandidatesRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const processedSignalsRef = useRef(new Set<string>());
  const offersSentRef = useRef(new Set<string>());
  const previousCallIdRef = useRef<string | null>(null);
  const onErrorRef = useRef(onError);
  const peerKey = useMemo(() => [...new Set(peerIds)].sort().join(","), [peerIds]);

  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const reportError = useCallback((message: string) => {
    setConnectionState("error");
    onErrorRef.current?.(message);
  }, []);

  const closePeer = useCallback((peerId: string) => {
    const peer = peersRef.current.get(peerId);
    if (peer) {
      peer.onicecandidate = null;
      peer.ontrack = null;
      peer.onconnectionstatechange = null;
      peer.close();
      peersRef.current.delete(peerId);
    }
    pendingCandidatesRef.current.delete(peerId);
    offersSentRef.current.delete(peerId);
    setRemoteStreams((current) => current.filter((item) => item.userId !== peerId));
  }, []);

  const stopMedia = useCallback(() => {
    for (const peerId of [...peersRef.current.keys()]) closePeer(peerId);
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    processedSignalsRef.current.clear();
    setRemoteStreams([]);
    setMicrophoneReady(false);
    setConnectionState("idle");
  }, [closePeer]);

  const prepareMicrophone = useCallback(async () => {
    const existing = localStreamRef.current;
    if (existing?.getAudioTracks().some((track) => track.readyState === "live")) {
      existing.getAudioTracks().forEach((track) => { track.enabled = true; });
      setMicrophoneReady(true);
      return;
    }
    if (!window.isSecureContext) {
      throw new Error("Il microfono richiede il sito HTTPS.");
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Questo dispositivo non supporta le chiamate audio dal browser.");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      stream.getAudioTracks().forEach((track) => { track.enabled = true; });
      localStreamRef.current = stream;
      setMicrophoneReady(true);
      setConnectionState("connecting");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        throw new Error("Permesso microfono negato. Consentilo nelle impostazioni del browser e riprova.");
      }
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        throw new Error("Non è stato trovato nessun microfono disponibile.");
      }
      throw new Error("Non è stato possibile attivare il microfono.");
    }
  }, []);

  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }, [muted]);

  const sendSignal = useCallback(async (
    targetCallId: string,
    recipientId: string,
    signalType: "offer" | "answer" | "ice_candidate" | "hangup",
    payload: Record<string, unknown>,
  ) => {
    if (!client || !currentUserId) return;
    const { error } = await client.from("call_signals").insert({
      room_id: roomId,
      call_id: targetCallId,
      sender_id: currentUserId,
      recipient_id: recipientId,
      signal_type: signalType,
      payload,
    });
    if (error) throw error;
  }, [client, currentUserId, roomId]);

  const flushCandidates = useCallback(async (peerId: string, peer: RTCPeerConnection) => {
    const pending = pendingCandidatesRef.current.get(peerId) ?? [];
    pendingCandidatesRef.current.delete(peerId);
    for (const candidate of pending) await peer.addIceCandidate(candidate);
  }, []);

  const ensurePeer = useCallback(async (
    targetCallId: string,
    peerId: string,
    initiator: boolean,
  ) => {
    if (!client || !currentUserId || peerId === currentUserId) return null;
    const stream = localStreamRef.current;
    if (!stream) return null;

    let peer = peersRef.current.get(peerId);
    if (!peer || peer.connectionState === "closed") {
      peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peersRef.current.set(peerId, peer);
      stream.getTracks().forEach((track) => peer?.addTrack(track, stream));

      peer.onicecandidate = (event) => {
        if (!event.candidate) return;
        void sendSignal(targetCallId, peerId, "ice_candidate", {
          candidate: event.candidate.toJSON(),
        }).catch((error) => reportError(error instanceof Error ? error.message : "Segnalazione audio non riuscita."));
      };
      peer.ontrack = (event) => {
        const remoteStream = event.streams[0] ?? new MediaStream([event.track]);
        setRemoteStreams((current) => [
          ...current.filter((item) => item.userId !== peerId),
          { userId: peerId, stream: remoteStream },
        ]);
      };
      peer.onconnectionstatechange = () => {
        if (!peer) return;
        if (peer.connectionState === "connected") setConnectionState("connected");
        if (peer.connectionState === "failed") {
          closePeer(peerId);
          reportError("La connessione audio non è riuscita. Controlla la rete e riprova.");
        }
      };
    }

    if (initiator && !offersSentRef.current.has(peerId)) {
      offersSentRef.current.add(peerId);
      setConnectionState("connecting");
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await sendSignal(targetCallId, peerId, "offer", { description: offer });
    }
    return peer;
  }, [client, closePeer, currentUserId, reportError, sendSignal]);

  const handleSignal = useCallback(async (rowValue: unknown) => {
    const row = asRecord(rowValue);
    const signalId = String(row.id ?? "");
    const senderId = typeof row.sender_id === "string" ? row.sender_id : "";
    const recipientId = typeof row.recipient_id === "string" ? row.recipient_id : null;
    const targetCallId = typeof row.call_id === "string" ? row.call_id : "";
    const signalType = typeof row.signal_type === "string" ? row.signal_type : "";
    if (!signalId || processedSignalsRef.current.has(signalId)) return;
    if (!targetCallId || targetCallId !== callId || senderId === currentUserId) return;
    if (recipientId && recipientId !== currentUserId) return;
    processedSignalsRef.current.add(signalId);

    const payload = asRecord(row.payload);
    try {
      if (signalType === "hangup") {
        closePeer(senderId);
        return;
      }
      if (signalType === "ice_candidate") {
        const candidate = asRecord(payload.candidate) as RTCIceCandidateInit;
        const peer = peersRef.current.get(senderId);
        if (peer?.remoteDescription) await peer.addIceCandidate(candidate);
        else pendingCandidatesRef.current.set(senderId, [
          ...(pendingCandidatesRef.current.get(senderId) ?? []),
          candidate,
        ]);
        return;
      }
      if (signalType === "offer") {
        const peer = await ensurePeer(targetCallId, senderId, false);
        if (!peer) return;
        await peer.setRemoteDescription(asRecord(payload.description) as unknown as RTCSessionDescriptionInit);
        await flushCandidates(senderId, peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await sendSignal(targetCallId, senderId, "answer", { description: answer });
        return;
      }
      if (signalType === "answer") {
        const peer = await ensurePeer(targetCallId, senderId, false);
        if (!peer) return;
        await peer.setRemoteDescription(asRecord(payload.description) as unknown as RTCSessionDescriptionInit);
        await flushCandidates(senderId, peer);
      }
    } catch (error) {
      reportError(error instanceof Error ? error.message : "Connessione audio non riuscita.");
    }
  }, [callId, closePeer, currentUserId, ensurePeer, flushCandidates, reportError, sendSignal]);

  useEffect(() => {
    if (!enabled || !client || !callId || !joined || !currentUserId || !microphoneReady) return;
    const channel = client
      .channel(`audio-call:${callId}:${currentUserId}:${crypto.randomUUID()}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "call_signals",
        filter: `call_id=eq.${callId}`,
      }, (payload) => { void handleSignal(payload.new); })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        void client.from("call_signals")
          .select("id,call_id,sender_id,recipient_id,signal_type,payload")
          .eq("call_id", callId)
          .order("id", { ascending: true })
          .then(({ data, error }) => {
            if (error) { reportError(error.message); return; }
            for (const signal of data ?? []) void handleSignal(signal);
          });
      });
    return () => { void client.removeChannel(channel); };
  }, [callId, client, currentUserId, enabled, handleSignal, joined, microphoneReady, reportError]);

  useEffect(() => {
    if (!enabled || !callId || !joined || !microphoneReady || !currentUserId) return;
    const uniquePeerIds = peerKey ? peerKey.split(",") : [];
    for (const peerId of uniquePeerIds) {
      if (currentUserId.localeCompare(peerId) < 0) {
        void ensurePeer(callId, peerId, true).catch((error) => {
          reportError(error instanceof Error ? error.message : "Chiamata audio non riuscita.");
        });
      }
    }
  }, [callId, currentUserId, enabled, ensurePeer, joined, microphoneReady, peerKey, reportError]);

  const hangUpPeers = useCallback(async (targetCallId: string, targetPeerIds: string[]) => {
    await Promise.allSettled(targetPeerIds.map((peerId) =>
      sendSignal(targetCallId, peerId, "hangup", {}),
    ));
    stopMedia();
  }, [sendSignal, stopMedia]);

  useEffect(() => {
    const previous = previousCallIdRef.current;
    if (previous && previous !== callId) stopMedia();
    previousCallIdRef.current = callId;
  }, [callId, stopMedia]);

  useEffect(() => () => stopMedia(), [stopMedia]);

  return {
    connectionState,
    microphoneReady,
    remoteStreams,
    prepareMicrophone,
    hangUpPeers,
    stopMedia,
  };
}
