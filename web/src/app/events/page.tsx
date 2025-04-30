"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "@/lib/api";
import EventCard from "@/components/common/EventCard";
import { Event } from "@/interfaces/event.interface";
import { FiFilter, FiSearch, FiX } from "react-icons/fi";
import { useDebounce } from "@/hooks/useDebounce";

export default function EventsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    sortBy: searchParams.get("sortBy") || "startDate",
    sortOrder: searchParams.get("sortOrder") || "asc",
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (debouncedSearch) params.append("search", debouncedSearch);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const url = `/api/events?${params.toString()}`;
      const response = await axios.get(url);

      setEvents(response.data.data);
      setMeta({
        total: response.data.meta.total,
        page: response.data.meta.page,
        totalPages: response.data.meta.totalPages,
      });

      // Update URL without page reload
      router.replace(`/events?${params.toString()}`, { scroll: false });
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [debouncedSearch, filters, searchParams]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      startDate: "",
      endDate: "",
      sortBy: "startDate",
      sortOrder: "asc",
    });
    setSearchQuery("");
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page: String(page) }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Upcoming Events</h1>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <FiFilter /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
                placeholder="Music, Sports, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
                placeholder="City or venue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded"
                  placeholder="Min"
                />
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded"
                  placeholder="Max"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              >
                <option value="startDate">Date</option>
                <option value="price">Price</option>
                <option value="title">Name</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <select
                name="sortOrder"
                value={filters.sortOrder}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 flex items-center gap-2"
            >
              <FiX /> Clear All
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-lg h-80 animate-pulse"
            ></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No events found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded ${
                      meta.page === page
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
