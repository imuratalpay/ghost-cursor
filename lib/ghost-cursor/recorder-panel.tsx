"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { startRecording, type Take } from "./recorder";
import { serialize, type Recording } from "./recording";

type Status = { kind: "idle" } | { kind: "recording"; events: number } | { kind: "done"; take: Recording };

export default function RecorderPanel({
  stage,
  content,
  remount,
  initial,
  onPreview,
}: {
  stage: RefObject<HTMLDivElement | null>;
  content: RefObject<HTMLDivElement | null>;
  remount: () => void;
  initial: Recording | null;
  onPreview: (take: Recording) => void;
}) {
  const [status, setStatus] = useState<Status>(initial ? { kind: "done", take: initial } : { kind: "idle" });
  const [copied, setCopied] = useState(false);
  const take = useRef<Take | null>(null);
  const timer = useRef<HTMLSpanElement>(null);

  useEffect(() => () => void take.current?.stop(), []);

  useEffect(() => {
    if (status.kind !== "recording") return;
    const started = performance.now();
    const id = setInterval(() => {
      if (timer.current) timer.current.textContent = `${((performance.now() - started) / 1000).toFixed(1)}s`;
    }, 100);
    return () => clearInterval(id);
  }, [status.kind]);

  const record = () => {
    remount();
    setCopied(false);
    take.current = startRecording(stage.current!, content.current!, (events) =>
      setStatus({ kind: "recording", events }),
    );
    setStatus({ kind: "recording", events: 0 });
  };

  const stop = () => {
    const rec = take.current?.stop();
    take.current = null;
    setStatus(rec && rec.events.length ? { kind: "done", take: rec } : { kind: "idle" });
  };

  const copy = async (rec: Recording) => {
    const json = serialize(rec);
    try {
      await navigator.clipboard.writeText(json);
    } catch {
      console.info(json);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="gc-controls gc-recorder" data-status={status.kind}>
      {status.kind === "recording" ? (
        <button type="button" className="gc-pill" onClick={stop}>
          <span className="gc-rec-dot" data-live="" />
          Stop
        </button>
      ) : (
        <button type="button" className="gc-pill" onClick={record}>
          <span className="gc-rec-dot" />
          {status.kind === "done" ? "Record again" : "Record"}
        </button>
      )}

      {status.kind === "idle" && <span className="gc-hint">Press record, then use the component in the box.</span>}

      {status.kind === "recording" && (
        <span className="gc-hint">
          <span ref={timer} className="gc-tabular">
            0.0s
          </span>{" "}
          · {status.events} events
        </span>
      )}

      {status.kind === "done" && (
        <>
          <button type="button" className="gc-pill gc-pill-strong" onClick={() => copy(status.take)}>
            <span className="gc-swap">
              <span data-shown={!copied || undefined}>Copy recording</span>
              <span data-shown={copied || undefined}>Copied</span>
            </span>
          </button>
          <button type="button" className="gc-pill" onClick={() => onPreview(status.take)}>
            Preview
          </button>
          <span className="gc-hint gc-tabular">
            {status.take.events.length} events · {(serialize(status.take).length / 1024).toFixed(1)} KB
          </span>
        </>
      )}
    </div>
  );
}
