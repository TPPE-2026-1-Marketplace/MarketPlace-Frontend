import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AccountHeaderProps {
  displayName: string;
  displayEmail: string;
}

export default function AccountHeader({ displayName, displayEmail }: AccountHeaderProps) {
  return (
    <div className="bg-[var(--action-primary)] py-10 text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 bg-white/20">
            <AvatarFallback className="bg-transparent font-serif text-2xl text-white">
              {displayName.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-serif text-2xl text-white">{displayName}</h1>
            <p className="font-sans text-sm text-gray-300">{displayEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
