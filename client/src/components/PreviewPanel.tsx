import React from "react";
import type { AspectRatio, IThumbnail } from "../assets/assets";
import { DownloadIcon, ImageIcon, Loader2Icon } from "lucide-react";

type PreviewPanelProps = {
  thumbnail: IThumbnail | null;
  isLoading: boolean;
  aspectRatio: AspectRatio;
};

const aspectClasses: Record<AspectRatio, string> = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
};

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  thumbnail,
  isLoading,
  aspectRatio,
}) => {
  const handleDownload = () => {
    if (!thumbnail?.image_url) return;
    window.open(thumbnail.image_url, "_blank");
  };

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div
        className={`relative overflow-hidden rounded-xl bg-black/20 ${aspectClasses[aspectRatio]}`}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/40">
            <Loader2Icon className="h-8 w-8 animate-spin text-zinc-300" />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-200">
                AI is creating your thumbnail...
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                This may take 10–20 seconds
              </p>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {!isLoading && thumbnail?.image_url && (
          <div className="group relative h-full w-full">
            <img
              src={thumbnail.image_url}
              alt={thumbnail.title ?? "Generated thumbnail"}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 flex items-end justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={handleDownload}
                className="mb-6 flex items-center gap-2 rounded-md bg-white/30 px-5 py-2.5 text-xs font-medium text-white ring-2 ring-white/40 backdrop-blur transition hover:scale-105 active:scale-95"
              >
                <DownloadIcon className="h-4 w-4" />
                Download Thumbnail
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !thumbnail?.image_url && (
          <div className="absolute inset-0 m-3 flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-white/20 bg-black/30">
            <div className="hidden sm:flex h-20 w-20 items-center justify-center rounded-full bg-black/30">
              <ImageIcon className="h-10 w-10 text-white/50" />
            </div>
            <div className="px-4 text-center">
              <p className="text-sm font-medium text-zinc-300">
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
