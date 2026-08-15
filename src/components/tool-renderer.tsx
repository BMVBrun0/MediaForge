"use client";

import { ImageOptimizer } from "@/src/features/image-optimizer";
import { BackgroundRemover } from "@/src/features/background-remover";
import { MetadataCleaner } from "@/src/features/metadata-cleaner";
import { ImageCompare } from "@/src/features/image-compare";
import { PaletteExtractor } from "@/src/features/palette-extractor";
import { AssetPack } from "@/src/features/asset-pack";
import { VideoLab } from "@/src/features/video-lab";
import { FileCrypto } from "@/src/features/file-crypto";
import { ChecksumTool } from "@/src/features/checksum-tool";
import { PasswordLab } from "@/src/features/password-lab";
import { ColorStudio } from "@/src/features/color-studio";
import { GradientBuilder } from "@/src/features/gradient-builder";

export function ToolRenderer({ toolId }: { toolId: string }) {
  switch (toolId) {
    case "background-remove": return <BackgroundRemover />;
    case "metadata-cleaner": return <MetadataCleaner />;
    case "image-compare": return <ImageCompare />;
    case "palette-extract": return <PaletteExtractor />;
    case "asset-pack": return <AssetPack />;
    case "video-lab": return <VideoLab />;
    case "file-crypto": return <FileCrypto />;
    case "checksum": return <ChecksumTool />;
    case "password-lab": return <PasswordLab />;
    case "color-studio": return <ColorStudio />;
    case "gradient-builder": return <GradientBuilder />;
    case "image-optimize":
    default:
      return <ImageOptimizer />;
  }
}
