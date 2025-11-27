"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { useMiniApp } from "@/contexts/miniapp-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import { useDisconnect } from "wagmi";
import {
  Wallet,
  Connect,
  Name,
  Avatar as ComposerAvatar,
} from "@composer-kit/ui/wallet";
import { LogOut, Moon, Sun } from "lucide-react";

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { context, isInMiniApp } = useMiniApp();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);

    // Check screen size
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Extract user data from context
  const user = context?.user;
  const username = user?.username;
  const displayName = user?.displayName;
  const pfpUrl = user?.pfpUrl;

  // Determine if we should show miniapp menu (in miniapp or small screen)
  const showMiniappMenu = (isInMiniApp || isSmallScreen) && isConnected;

  if (!mounted) {
    // For non-miniapp, use ComposerKit components
    if (!isInMiniApp) {
      return (
        <Wallet>
          <Connect label="Connect Wallet">
            <span>Connect Wallet</span>
          </Connect>
        </Wallet>
      );
    }
    // For miniapp, show button (will connect to Farcaster when clicked)
    return (
      <Button variant="outline" size="sm">
        Connect Wallet
      </Button>
    );
  }

  // Non-miniapp environment: Use ComposerKit components
  if (!isInMiniApp) {
    return (
      <Wallet>
        <Connect label="Connect Wallet">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <ComposerAvatar className="w-6 h-6" />
              <Name isTruncated className="text-sm" />
            </div>
          ) : (
            <span>Connect Wallet</span>
          )}
        </Connect>
      </Wallet>
    );
  }

  // Miniapp environment
  if (!isConnected) {
    // Find Farcaster connector for miniapp
    const farcasterConnector = connectors.find(
      (connector) =>
        connector.id === "farcaster" || connector.id === "frameWallet"
    );

    return (
      <Button
        onClick={() => {
          if (farcasterConnector) {
            connect({ connector: farcasterConnector });
          } else {
            console.error("Farcaster connector not found");
          }
        }}
        variant="outline"
        size="sm"
        disabled={!farcasterConnector}
      >
        Connect Wallet
      </Button>
    );
  }

  // Connected in miniapp - show menu for small screens or miniapp
  if (showMiniappMenu && username) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 px-3"
          >
            {pfpUrl && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={pfpUrl} alt={displayName || username} />
                <AvatarFallback>
                  {username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="text-sm font-medium">
              {username.startsWith("@") ? username : `@${username}`}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2">
              {pfpUrl && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={pfpUrl} alt={displayName || username} />
                  <AvatarFallback>
                    {username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {displayName || username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {username.startsWith("@") ? username : `@${username}`}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              toggleTheme();
            }}
            className="flex items-center justify-between w-full cursor-pointer"
          >
            <span className="text-sm">Theme</span>
            <div className="flex items-center gap-2">
              {theme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="text-xs text-muted-foreground">
                {theme === "light" ? "Light" : "Dark"}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => disconnect()}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Fallback: show regular button with disconnect
  return (
    <div className="flex items-center gap-2">
      <div className="px-3 py-1.5 rounded-md border border-input bg-background">
        <span className="text-sm font-medium">
          {address
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : "Connected"}
        </span>
      </div>
      <Button
        onClick={() => disconnect()}
        variant="outline"
        size="sm"
        className="h-8 px-2"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
