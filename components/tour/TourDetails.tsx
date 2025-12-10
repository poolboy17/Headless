interface TourDetailsProps {
  inclusions?: string[] | null;
  exclusions?: string[] | null;
  meetingPoint?: string | null;
  accessibility?: string | null;
  duration?: string | null;
}

export function TourDetails({
  inclusions,
  exclusions,
  meetingPoint,
  accessibility,
  duration,
}: TourDetailsProps) {
  const hasDetails = inclusions?.length || exclusions?.length || meetingPoint || accessibility || duration;

  if (!hasDetails) return null;

  return (
    <section className="my-12 bg-gray-50 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Tour Details</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inclusions */}
        {inclusions && inclusions.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              What's Included
            </h3>
            <ul className="space-y-2">
              {inclusions.map((item, i) => (
                <li key={i} className="text-gray-700 flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Exclusions */}
        {exclusions && exclusions.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Not Included
            </h3>
            <ul className="space-y-2">
              {exclusions.map((item, i) => (
                <li key={i} className="text-gray-700 flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Additional Info */}
      {(meetingPoint || accessibility || duration) && (
        <div className="mt-6 pt-6 border-t border-gray-200 grid md:grid-cols-3 gap-4">
          {meetingPoint && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Meeting Point
              </h4>
              <p className="text-gray-700">{meetingPoint}</p>
            </div>
          )}
          {duration && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Duration
              </h4>
              <p className="text-gray-700">{duration}</p>
            </div>
          )}
          {accessibility && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Accessibility
              </h4>
              <p className="text-gray-700">{accessibility}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
