import type { ContentSection } from "@/types/tour-content";

interface ContentSectionsProps {
  sections: ContentSection[];
}

export function ContentSections({ sections }: ContentSectionsProps) {
  return (
    <div className="prose prose-lg max-w-none">
      {sections.map((section, index) => (
        <Section key={index} section={section} />
      ))}
    </div>
  );
}

function Section({ section }: { section: ContentSection }) {
  switch (section.type) {
    case "intro":
      return (
        <p className="text-xl text-gray-700 leading-relaxed mb-6">
          {section.content}
        </p>
      );

    case "heading":
      const HeadingTag = `h${section.level}` as keyof JSX.IntrinsicElements;
      const headingClasses = {
        2: "text-2xl font-bold text-gray-900 mt-8 mb-4",
        3: "text-xl font-semibold text-gray-900 mt-6 mb-3",
        4: "text-lg font-semibold text-gray-800 mt-4 mb-2",
      };
      return (
        <HeadingTag className={headingClasses[section.level]}>
          {section.content}
        </HeadingTag>
      );

    case "paragraph":
      return (
        <p className="text-gray-700 leading-relaxed mb-4">
          {section.content}
        </p>
      );

    case "list":
      const ListTag = section.style === "numbered" ? "ol" : "ul";
      const listClasses = section.style === "numbered"
        ? "list-decimal list-inside space-y-2 mb-6 text-gray-700"
        : "list-disc list-inside space-y-2 mb-6 text-gray-700";
      return (
        <ListTag className={listClasses}>
          {section.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ListTag>
      );

    case "image":
      return (
        <figure className="my-8">
          <img
            src={section.url}
            alt={section.alt}
            className="w-full rounded-lg shadow-md"
          />
          {section.caption && (
            <figcaption className="text-sm text-gray-500 mt-2 text-center">
              {section.caption}
            </figcaption>
          )}
        </figure>
      );

    case "quote":
      return (
        <blockquote className="border-l-4 border-red-600 pl-4 my-6 italic text-gray-700">
          <p>{section.content}</p>
          {section.attribution && (
            <footer className="text-sm text-gray-500 mt-2">
              — {section.attribution}
            </footer>
          )}
        </blockquote>
      );

    case "highlight":
      const highlightStyles = {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        warning: "bg-amber-50 border-amber-200 text-amber-800",
        tip: "bg-green-50 border-green-200 text-green-800",
      };
      return (
        <div className={`p-4 rounded-lg border my-6 ${highlightStyles[section.style]}`}>
          {section.title && (
            <p className="font-semibold mb-2">{section.title}</p>
          )}
          <p>{section.content}</p>
        </div>
      );

    default:
      return null;
  }
}
