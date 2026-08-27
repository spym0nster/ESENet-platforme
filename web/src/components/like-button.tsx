"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/app/actions/reactions";

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
      onClick={() => {
        // Optimistic: flip immediately, reconcile if the server disagrees.
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
      className={`inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide transition ${
        liked ? "text-accent-2" : "text-text-faint hover:text-text-muted"
      }`}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      {count > 0 ? count : "Like"}
    </button>
  );
}
