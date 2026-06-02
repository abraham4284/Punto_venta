type SidebarLinkClassProps = {
  current: boolean;
  extra?: string;
};

export function sidebarLinkClass({
  current,
  extra = "",
}: SidebarLinkClassProps) {
  return [
    "flex items-center p-2 rounded-lg group transition",
    current
      ? "bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-white font-bold"
      : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
