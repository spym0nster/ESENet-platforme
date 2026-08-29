"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/app/actions/reactions";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20.5 4.2 12.7a4.6 4.6 0 0 1 0-6.5 4.6 4.6 0 0 1 6.5 0l1.3 1.3 1.3-1.3a4.6 4.6 0 0 1 6.5 0 4.6 4.6 0 0 1 0 6.5Z" />
    </svg>
  );
}

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      onClick={() => {
        const nextLiked = !liked;
        setLiked(nextLiked);
        setCount((c) => c + (nextLiked ? 1 : -1));
        startTransition(async () => {
          const result = await toggleLike(postId);
          if (!result || "error" in result) {
            setLiked(liked);
            setCount((c) => c + (nextLiked ? -1 : 1));
          }
        });
      }}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-ctrl px-2 font-mono text-xs transition ${
        liked ? "text-accent-2" : "text-text-faint hover:bg-text/8 hover:text-text"
      }`}
    >
      <HeartIcon filled={liked} />
      {count > 0 ? count : "Like"}
    </button>
  );
}
