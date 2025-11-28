"use client";
import { sdk, type Context } from "@farcaster/miniapp-sdk";
// Use any types for Farcaster SDK compatibility
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAccount, useConnect } from "wagmi";

type FrameContext = Context.MiniAppContext;
interface MiniAppContextType {
  context: FrameContext | null;
  isInMiniApp: boolean;
}

const MiniAppContext = createContext<MiniAppContextType | undefined>(undefined);

interface MiniAppProviderProps {
  addMiniAppOnLoad?: boolean;
  children: ReactNode;
}

export function MiniAppProvider({
  children,
  addMiniAppOnLoad,
}: MiniAppProviderProps): JSX.Element {
  const [context, setContext] = useState<FrameContext | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const hasAttemptedAutoConnect = useRef(false);

  // Account and connect hooks
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  // Initial setup: check if in miniapp and auto-connect only once on mount
  useEffect(() => {
    const autoConnect = async () => {
      // Only attempt auto-connect once on initial mount
      if (hasAttemptedAutoConnect.current) {
        return;
      }

      try {
        // Check if we're in a miniapp - wrap in try/catch with timeout to prevent hanging
        let isInMiniApp = false;
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 2000)
          );

          isInMiniApp = await Promise.race([sdk.isInMiniApp(), timeoutPromise]);
        } catch (err) {
          // Not in miniapp, SDK methods will fail or timeout
          console.log("Not in miniapp environment or SDK check timed out");
          setIsInMiniApp(false);
          hasAttemptedAutoConnect.current = true;
          return;
        }

        setIsInMiniApp(isInMiniApp);
        hasAttemptedAutoConnect.current = true;

        // Only proceed with miniapp-specific logic if we're actually in a miniapp
        if (isInMiniApp) {
          // Only auto-connect if not already connected (initial mount only)
          if (!isConnected) {
            console.log("Auto-connecting to Farcaster on initial load");
            const farcasterConnector = connectors.find(
              (c) => c.id === "farcaster"
            );
            if (farcasterConnector) {
              connect({ connector: farcasterConnector });
            }
          }

          // Only fetch context when in miniapp, with timeout
          try {
            const contextPromise = Promise.resolve(sdk.context);
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 2000)
            );

            const context = await Promise.race([
              contextPromise,
              timeoutPromise,
            ]);
            const chains = await sdk.getChains();
            console.log("[MiniAppProvider.useEffect] >> Chains", chains);
            console.log("[MiniAppProvider.useEffect] >> Context", context);
            setContext(context);
          } catch (err) {
            console.error("Failed to get miniapp context:", err);
          }

          // Note: Quick Auth sign-in should be handled by QuickAuthProvider
          // It will automatically sign in when the component mounts and detects miniapp
        }
      } catch (err) {
        console.error("Auto-connect error:", err);
        // Ensure we set isInMiniApp to false on error
        setIsInMiniApp(false);
        hasAttemptedAutoConnect.current = true;
      }
    };
    autoConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleAddMiniApp = useCallback(async () => {
    try {
      // Check if addMiniApp action is available
      if (typeof sdk !== "undefined" && sdk.actions?.addMiniApp) {
        const result = await sdk.actions.addMiniApp();
        if (result) {
          return result;
        }
      }
      console.error(
        "[MiniAppProvider.handleAddMiniApp] >> addMiniApp action not available"
      );
      return null;
    } catch (e) {
      const error = e as Error;
      console.error(
        "[MiniAppProvider.handleAddMiniApp] >> adding frame error",
        error
      );
      // if (error?.message?.includes("domain")) {
      //   setAddMiniAppMessage(
      //     "⚠️ This miniapp can only be added from its official domain"
      //   );
      // } else {
      //   setAddMiniAppMessage(
      //     "❌ Failed to add miniapp. Please try again."
      //   );
      // }
      return null;
    }
  }, []);

  useEffect(() => {
    // on load, set the frame as ready
    if (isInMiniApp && !context?.client?.added && addMiniAppOnLoad) {
      handleAddMiniApp();
    }
  }, [isInMiniApp, context?.client?.added, handleAddMiniApp, addMiniAppOnLoad]);

  return (
    <MiniAppContext.Provider
      value={{
        context,
        isInMiniApp,
      }}
    >
      {children}
    </MiniAppContext.Provider>
  );
}

export function useMiniApp(): MiniAppContextType {
  const context = useContext(MiniAppContext);
  if (context === undefined) {
    throw new Error("useMiniApp must be used within a MiniAppProvider");
  }
  return context;
}
