
import React from 'react';

export default function MoleculeBackground() {
  // Simple animated background using CSS gradients and blobs
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
           style={{background: 'radial-gradient(circle, rgba(79,209,197,0.6) 0%, rgba(96,165,250,0.5) 60%, rgba(255,255,255,0) 70%)'}}/>
      <div className="absolute -bottom-20 -right-20 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-30 animate-[pulse_8s_ease-in-out_infinite]"
           style={{background: 'radial-gradient(circle, rgba(96,165,250,0.6) 0%, rgba(16,185,129,0.4) 60%, rgba(255,255,255,0) 70%)'}}/>
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 600" preserveAspectRatio="none">
        <g fill="none" stroke="currentColor" strokeWidth="0.8">
          {[...Array(40)].map((_,i)=>{
            const x = (i*19)%800, y = (i*47)%600, r = 4 + (i%6);
            return <circle key={i} cx={x} cy={y} r={r} />;
          })}
        </g>
      </svg>
    </div>
  );
}
