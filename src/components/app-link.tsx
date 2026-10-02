"use client";

import type { ComponentProps } from "react";
import NextLink from "next/link";
import { AutoText } from "@/components/auto-text";

export default function Link({ children, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props}>
      <AutoText>{children}</AutoText>
    </NextLink>
  );
}
