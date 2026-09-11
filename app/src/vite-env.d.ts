/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// <iconify-icon> is a custom element registered globally by the Iconify web
// component script (loaded in index.html) — not a real DOM/React element, so
// TSX needs an explicit intrinsic-element type for it.
declare namespace React.JSX {
  interface IntrinsicElements {
    'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      icon: string;
      width?: string | number;
      height?: string | number;
      inline?: boolean;
    };
  }
}
