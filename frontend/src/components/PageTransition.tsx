import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

const PageTransition = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full">
      {children}
    </div>
  );
};

export default PageTransition;
