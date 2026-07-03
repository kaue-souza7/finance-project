import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { useIsIOS } from "../hooks/useIsIOS";
import { useIsPWA } from "../hooks/useIsPWA";
import { usePWAUpdate } from "../hooks/usePWAUpdate";
import { InstallButton } from "./InstallButton";
import { IOSInstallCard } from "./IOSInstallCard";
import { OnlineStatus } from "./OnlineStatus";
import { UpdateBanner } from "./UpdateBanner";

export function PwaInstallWrapper() {
  const isPWA = useIsPWA();
  const { isInstallAvailable, install } = useInstallPrompt();
  const isIOS = useIsIOS();
  const { needRefresh, update } = usePWAUpdate();

  return (
    <>
      <OnlineStatus />

      {needRefresh && <UpdateBanner onUpdate={update} />}

      {!isPWA && isInstallAvailable && <InstallButton onInstall={install} />}

      {!isPWA && isIOS && !isInstallAvailable && <IOSInstallCard />}
    </>
  );
}
