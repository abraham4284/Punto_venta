import { Link } from "react-router-dom";

type LiGeneralProps = {
  setIsOpen: (open: boolean) => void;
  isOpen: boolean;
  links: { id: number; title: string; url: string }[];
  sidebarLinkClass: (props: { current: boolean }) => string;
  location: any;
  title: string;
};

export const LiGeneral = ({
  setIsOpen,
  isOpen,
  links,
  sidebarLinkClass,
  location,
  title,
}: LiGeneralProps) => {
  const classTitle = isOpen
    ? "ms-3 flex-1 text-left cursor-pointer  text-blue-700 dark:bg-gray-700 dark:text-white font-bold"
    : "ms-3 flex-1 text-left cursor-pointer";
  const classImg = isOpen ? "size-6 text-blue-700 font-bold " : "size-6";

  // Encuentra el link más específico que coincide con la ruta actual
  const activeUrl = links
    .map((l) => l.url)
    .filter(
      (url) =>
        location.pathname === url || location.pathname.startsWith(url + "/"),
    )
    .sort((a, b) => b.length - a.length)[0];
  return (
    <li>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center w-full p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group transition`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={classImg}
        >
          {/* tu icono acá */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
          />
        </svg>
        <span className={classTitle}>{title}</span>
        <svg
          className={`w-4 h-4 ml-auto transition-transform ${
            isOpen ? "rotate-90" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
      {/* Submenú */}
      {isOpen &&
        links.map((el) => (
          <ul
            key={el.url}
            className={`
            ml-8 mt-1 space-y-1 overflow-hidden transition-all duration-700 
          ${isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}
                    `}
          >
            <li>
              <Link
                to={el.url}
                className={sidebarLinkClass({
                  current: activeUrl === el.url,
                })}
              >
                {el.title}
              </Link>
            </li>
          </ul>
        ))}
    </li>
  );
};
