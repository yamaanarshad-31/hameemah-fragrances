import Image from "next/image";
import { IntroDone } from "./IntroDone";

const WORD = "FRAGRANCES";

/**
 * First-visit curtain. Pure CSS so it plays before any JavaScript loads;
 * the inline script in app/layout.tsx <head> hides it for the rest of the session.
 */
export function Intro() {
  return (
    <>
      <div id="intro" aria-hidden className="intro fixed inset-0 z-[100] overflow-hidden">
        <div className="intro-panel intro-top" />
        <div className="intro-panel intro-bot" />
        <div className="intro-stage absolute inset-0 flex flex-col items-center justify-center">
          <div className="intro-glow absolute size-[36rem] rounded-full" />
          <div className="intro-mark relative">
            <Image src="/brand/logo-mark.png" alt="" style={{ width: "auto" }} width={220} height={280} priority className="h-52 w-auto sm:h-64" />
            <span className="intro-sweep absolute inset-0" />
          </div>
          <p className="mt-6 flex font-caps text-2xl tracking-[0.35em] text-gold-2 sm:text-3xl">
            {WORD.split("").map((ch, i) => (
              <span key={i} className="intro-letter inline-block" style={{ animationDelay: `${0.9 + i * 0.05}s` }}>{ch}</span>
            ))}
          </p>
          <span className="intro-line mt-3 block h-px w-56 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <p className="intro-by mt-3 font-caps text-xs tracking-[0.6em] text-gold/80">BY HAMEEMAH</p>
        </div>
      </div>
      <IntroDone />
      <style>{`
        .intro-seen #intro{display:none}
        .intro{animation:introOff 0s linear 3.3s forwards}
        .intro-panel{position:absolute;left:0;right:0;height:50.5%;background:radial-gradient(ellipse at center,#0f3d2a 0%,#06140d 75%)}
        .intro-top{top:0;animation:panelUp 1s cubic-bezier(.8,0,.2,1) 2.35s forwards}
        .intro-bot{bottom:0;animation:panelDown 1s cubic-bezier(.8,0,.2,1) 2.35s forwards}
        .intro-stage{animation:stageOut .6s ease 2.1s forwards}
        .intro-glow{background:radial-gradient(circle,rgba(212,175,55,.28),transparent 65%);animation:glow 2.4s ease forwards}
        .intro-mark{clip-path:inset(100% 0 0 0);filter:blur(8px);animation:markIn 1.1s cubic-bezier(.2,.8,.2,1) .15s forwards}
        .intro-sweep{background:linear-gradient(110deg,transparent 35%,rgba(255,250,220,.85) 50%,transparent 65%);mix-blend-mode:overlay;transform:translateX(-120%);animation:sweep 1.1s ease 1.1s forwards;-webkit-mask:url(/brand/logo-mark.png) center/contain no-repeat;mask:url(/brand/logo-mark.png) center/contain no-repeat}
        .intro-letter{opacity:0;transform:translateY(18px);animation:letter .6s cubic-bezier(.2,.8,.2,1) forwards}
        .intro-line{transform:scaleX(0);animation:line .9s ease 1.3s forwards}
        .intro-by{opacity:0;animation:fade .7s ease 1.6s forwards}
        @keyframes markIn{to{clip-path:inset(0 0 0 0);filter:blur(0)}}
        @keyframes sweep{to{transform:translateX(120%)}}
        @keyframes letter{to{opacity:1;transform:none}}
        @keyframes line{to{transform:scaleX(1)}}
        @keyframes fade{to{opacity:1}}
        @keyframes glow{0%{opacity:0;transform:scale(.6)}60%{opacity:1}100%{opacity:.8;transform:scale(1.1)}}
        @keyframes stageOut{to{opacity:0;transform:scale(1.06)}}
        @keyframes panelUp{to{transform:translateY(-101%)}}
        @keyframes panelDown{to{transform:translateY(101%)}}
        @keyframes introOff{to{visibility:hidden;pointer-events:none}}
      `}</style>
    </>
  );
}
