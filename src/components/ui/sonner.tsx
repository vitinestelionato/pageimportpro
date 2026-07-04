import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Pill-style toasts: dark rounded surface, colored icon disc on the left,
 * white text, close button on the right. Icons use the app's blue theme.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      closeButton
      className="toaster group"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-[oklch(0.18_0.03_260)] px-4 py-3 pr-10 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] backdrop-blur",
          title: "text-sm font-medium text-white leading-none",
          description: "text-xs text-white/70",
          icon: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:stroke-[3]",
          closeButton:
            "!left-auto !right-3 !top-1/2 !-translate-y-1/2 !translate-x-0 !h-5 !w-5 !rounded-full !border-0 !bg-transparent !text-white/60 hover:!bg-white/10 hover:!text-white",
          success: "[&>[data-icon]]:bg-primary",
          error: "[&>[data-icon]]:bg-rose-500",
          warning: "[&>[data-icon]]:bg-amber-500",
          info: "[&>[data-icon]]:bg-primary",
          default: "[&>[data-icon]]:bg-primary",
          actionButton:
            "group-[.toast]:rounded-full group-[.toast]:bg-primary group-[.toast]:px-3 group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:rounded-full group-[.toast]:bg-white/10 group-[.toast]:px-3 group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
