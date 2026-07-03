import { useRef, useState } from "react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { useIsIOS } from "../hooks/useIsIOS";
import { useIsPWA } from "../hooks/useIsPWA";
import { usePWAUpdate } from "../hooks/usePWAUpdate";
import { InstallButton } from "./InstallButton";
import { IOSInstallCard } from "./IOSInstallCard";
import { OnlineStatus } from "./OnlineStatus";
import { UpdateBanner } from "./UpdateBanner";
import { WebAuthnRegisterPrompt } from "@/webauthn/components/WebAuthnRegisterPrompt";
import { isPlatformAuthenticatorAvailable } from "@/webauthn/utils/webauthn";

export function PwaInstallWrapper() {
  const isPWA = useIsPWA();
  const { isInstallAvailable, install } = useInstallPrompt();
  const isIOS = useIsIOS();
  const { needRefresh, update } = usePWAUpdate();
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const biometricChecked = useRef(false);

  if (!biometricChecked.current) {
    biometricChecked.current = true;
    const alreadyRegistered = localStorage.getItem("webauthn_device");
    if (!alreadyRegistered) {
      isPlatformAuthenticatorAvailable().then((available) => {
        if (available) {
          setShowBiometricPrompt(true);
        }
      });
    }
  }

  return (
    <>
      <OnlineStatus />

      {needRefresh && <UpdateBanner onUpdate={update} />}

      {!isPWA && isInstallAvailable && <InstallButton onInstall={install} />}

      {!isPWA && isIOS && !isInstallAvailable && <IOSInstallCard />}

      {showBiometricPrompt && (
        <WebAuthnRegisterPrompt
          onComplete={() => {
            setShowBiometricPrompt(false);
            localStorage.setItem("webauthn_device", "true");
          }}
          onSkip={() => setShowBiometricPrompt(false)}
        />
      )}
    </>
  );
}
