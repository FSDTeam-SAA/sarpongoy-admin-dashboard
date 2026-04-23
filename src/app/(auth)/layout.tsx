import React from "react";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] px-4 py-8 flex items-center justify-center">
      {children}
    </div>
  );
}

export default layout;
