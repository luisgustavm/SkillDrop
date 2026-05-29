import Image from "next/image";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  className?: string;
};

export function UserAvatar({ src, name, className }: UserAvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name ? `Avatar de ${name}` : "Avatar do usuário"}
        width={36}
        height={36}
        className={cn("h-9 w-9 rounded-md object-cover", className)}
      />
    );
  }

  return (
    <span className={cn("flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground", className)}>
      <UserRound className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}
