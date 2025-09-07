// components/LoadingBar.jsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const LoadingBar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // This effect runs whenever the pathname changes.
    // We set a short timeout to show the loader for a minimum duration.
    const timer = setTimeout(() => {
      setIsLoading(true);
    }, 100); // 100ms delay to prevent flashing on fast page loads

    // Clean up the timer when the component unmounts or pathname changes again
    return () => {
      clearTimeout(timer);
      setIsLoading(false);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 w-full h-1 z-[9999] bg-rose-400"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          exit={{
            width: "100%",
            transition: { duration: 0.5, ease: "easeInOut" },
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      )}
    </AnimatePresence>
  );
};

export default LoadingBar;
