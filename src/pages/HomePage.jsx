import React, { useEffect, useState } from "react";
import logo from "../assets/logo.png";

export default function Home() {
  const MAX_TALK_TIME = 30;
  const MIN_SCALE = 1;
  const MAX_SCALE = 1.6; // smaller maximum scale
  const GROW_SPEED = 1;
  const SHRINK_SPEED = 1;

  const [talkTime, setTalkTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let audioContext;
    let analyser;
    let dataArray;

    async function startMic() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      source.connect(analyser);

      dataArray = new Uint8Array(analyser.frequencyBinCount);

      let last = performance.now();

      function tick(now) {
        const dt = (now - last) / 1000;
        last = now;

        analyser.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }

        const rms = Math.sqrt(sum / dataArray.length);
        const speaking = rms > 0.02;
        setIsSpeaking(speaking);

        setTalkTime(prev => {
          let next = prev;
          if (speaking) next += dt * GROW_SPEED;
          else next -= dt * SHRINK_SPEED;
          return Math.min(Math.max(next, 0), MAX_TALK_TIME);
        });

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }

    startMic();
  }, []);

  // Balloon scale
  const balloonScale = MIN_SCALE + ((MAX_SCALE - MIN_SCALE) * talkTime) / MAX_TALK_TIME;

  // Color gradient: blue → purple → red
  const progress = (balloonScale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE);
  const r = Math.floor(progress * 255);
  const g = Math.floor((1 - progress) * 180);
  const b = Math.floor((1 - progress) * 255);
  const color = `rgb(${r}, ${g}, ${b})`;

  // Responsive sizing with max size for desktop
  const baseSize = Math.min(window.innerWidth * 0.5, 200); // max width 200px

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        textAlign: "center",
        padding: 20,
        boxSizing: "border-box",
        position: "relative"
      }}
    >
      {/* Logo above reset button */}
      <img
        src={logo}
        alt="Logo"
        style={{
          width: 300,
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)"
        }}
      />

      {/* Reset button */}
      <button
        onClick={() => setTalkTime(0)}
        style={{
          position: "absolute",
          top: 180,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 20px",
          fontSize: 16,
          borderRadius: 8,
          border: "none",
          backgroundColor: "#75caff",
          color: "#fff",
          cursor: "pointer",
          zIndex: 2
        }}
      >
        Reset
      </button>

      {/* Balloon */}
      <div
        style={{
          width: baseSize,
          height: baseSize,
          borderRadius: "50%",
          backgroundColor: color,
          transform: `scale(${balloonScale})`,
          transformOrigin: "center",
          transition: "transform 0.1s linear, background-color 0.2s linear",
          position: "relative",
          zIndex: 0
        }}
      />

      {/* Text in front of balloon */}
      <p
        style={{
          marginTop: 20,
          fontSize: 18,
          position: "relative",
          zIndex: 1
        }}
      >
        Speaking: {isSpeaking ? "Yes" : "No"} <br />
        Talk Time: {talkTime.toFixed(1)}s / {MAX_TALK_TIME}s
      </p>
    </div>
  );
}
