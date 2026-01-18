import React from "react";
import type { AspectRatio, IThumbnail } from "../assets/assets";
import { div } from "motion/react-client";
import { DownloadIcon, ImageIcon, Loader2Icon } from "lucide-react";

const PreviewPanel = ({
  thumbnail,
  isLoading,
  aspectRatio,
}: {
  thumbnail: IThumbnail | null;
  isLoading: boolean;
  aspectRatio: AspectRatio;
}) => {
  const aspectClasses = {
    "16:9": "aspect-video",
    "1:1": "aspect-square",
    "9:16": "aspect-[9/16]",
  } as Record<AspectRatio, string>;

  const onDownload = () => {
    if (!thumbnail.image_url) return;
    window.open(thumbnail.image_url, "_blank");
  };
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className={`relative overflow-hidden ${aspectClasses[aspectRatio]}`}>
        {/*loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/25">
            <Loader2Icon className="size-8 animate-spin text-zinc-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-200">
                AI is creating your thumbnail...
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                This may take 10-20 seconds
              </p>
            </div>
          </div>
        )}
        {/*Image preview */}
        {!isLoading && thumbnail?.image_url && (
          <div className="group relative h-full w-full">
            <img
              src={thumbnail.image_url}
              alt={thumbnail.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute insect-0 flex items-end justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={onDownload}
                type="button"
                className="mb-6 flex items-center gap-2 rouded-md px-5 py-2.5 text-xs font-medium transition bg-white/30 ring-2 ring-white/40 backdrop-blur hover:scale-105 active:scale-95"
              >
                <DownloadIcon className="size-4" />
                Dowload Thumbnail
              </button>
            </div>
          </div>
        )}
        {/*Empty preview */}
        {!isLoading && !thumbnail?.image_url && (
          <div className="absolute inset-0 m-2 flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-white/20 bg-black/25">
            <div className="max-sm:hidden flex size-20 items-center justify-center rounded-full bg-black/25">
              <ImageIcon className="size-10 text-white opacity-50" />
            </div>
            <div className="px-4 text-center">
              <p className="font text-zinc-400">
                Generate your first thumbnail
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Fill out the form and click Generate
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
