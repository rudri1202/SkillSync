import { useState } from 'react'
import { Star } from 'lucide-react'

/**
 * StarRating — display-only or interactive 1–5 star widget.
 *
 * Props:
 *   rating      (number)  — current rating value (0 = no rating)
 *   max         (number)  — number of stars, default 5
 *   interactive (bool)    — if true, renders clickable stars
 *   onRate      (fn)      — called with star index when clicked
 *   size        (number)  — icon size in px, default 18
 */
export function StarRating({ rating = 0, max = 5, interactive = false, onRate, size = 18 }) {
  const [hovered, setHovered] = useState(0)

  const filled = interactive ? (hovered || rating) : rating

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`transition-transform ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <Star
            size={size}
            className={
              star <= Math.round(filled)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 fill-gray-100'
            }
          />
        </button>
      ))}
    </div>
  )
}
