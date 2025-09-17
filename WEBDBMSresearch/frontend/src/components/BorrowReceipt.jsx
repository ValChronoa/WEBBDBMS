import React, { useState } from "react";

export default function BorrowReceipt({ request }) {
  const [qrEnlarged, setQrEnlarged] = useState(false);
  if (!request) return null;
  return (
    <div className="max-w-2xl mx-auto bg-slate-900 rounded-3xl shadow-2xl p-8 border-2 border-yellow-500/30 mt-8">
      <h2 className="text-2xl font-bold text-yellow-300 mb-4">Borrow Receipt</h2>
      <div className="mb-4 text-lg text-yellow-200 font-semibold">User: {request.username}</div>
      <div className="mb-4">
        <span className="font-semibold text-yellow-400">Status:</span> <span className="text-yellow-200">{request.status}</span>
      </div>
      <div className="mb-6">
        <span className="font-semibold text-yellow-400">Items:</span>
        <ul className="list-disc ml-8 mt-2 text-yellow-100">
          {request.items.map((item, idx) => (
            <li key={item.id} className="mb-1">
              <span className="font-bold">{item.name}</span> <span className="ml-2 text-yellow-400">Qty: {item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
      {request.qr_code && (
        <div className="mb-6 flex flex-col items-center">
          <span className="font-semibold text-yellow-400 mb-2">QR Code:</span>
          <img
            src={request.qr_code}
            alt="QR Code"
            className={qrEnlarged ? "w-96 h-96 cursor-zoom-out rounded-2xl border-4 border-yellow-400 shadow-xl" : "w-32 h-32 cursor-zoom-in rounded-xl border-2 border-yellow-400 shadow"}
            onClick={() => setQrEnlarged(!qrEnlarged)}
          />
          <div className="text-xs text-yellow-300 mt-2">Click QR to enlarge</div>
        </div>
      )}
      <div className="mt-4">
        <span className="font-semibold text-yellow-400">Requested At:</span> <span className="text-yellow-200">{request.requested_at}</span>
      </div>
      {request.approved_at && (
        <div className="mt-2">
          <span className="font-semibold text-yellow-400">Approved At:</span> <span className="text-yellow-200">{request.approved_at}</span>
        </div>
      )}
      {request.returned_at && (
        <div className="mt-2">
          <span className="font-semibold text-yellow-400">Returned At:</span> <span className="text-yellow-200">{request.returned_at}</span>
        </div>
      )}
      {request.cancelled_at && (
        <div className="mt-2">
          <span className="font-semibold text-yellow-400">Cancelled At:</span> <span className="text-yellow-200">{request.cancelled_at}</span>
        </div>
      )}
    </div>
  );
}
