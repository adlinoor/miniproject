import Image from "next/image";
import Link from "next/link";
import { Event } from "@/interfaces/event.interface";
import { formatDate } from "@/utils/helpers";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48">
        <Image
          src={event.images[0]?.url || "/placeholder-event.jpg"}
          alt={event.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-1">
          {event.title}
        </h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
          {event.description}
        </p>

        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="mr-2">🗓️ {formatDate(event.startDate)}</span>
          <span>📍 {event.location}</span>
        </div>

        <div className="flex justify-between items-center mt-4">
          <span className="font-bold text-indigo-600">
            {event.price === 0 ? "FREE" : `IDR ${event.price.toLocaleString()}`}
          </span>
          <Link
            href={`/events/${event.id}`}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
