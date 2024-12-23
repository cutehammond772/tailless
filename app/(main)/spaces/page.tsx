import server from "@/components/motion/server";
import { notFound } from "next/navigation";

// Server Actions
import { HttpStatus } from "@/actions/response";
import { getSpaces } from "@/actions/space/primitives";

// Components
import SpaceCard from "@/features/space/space-card";

export default async function MainPage() {
  const spaces = await getSpaces({});

  if (spaces.status !== HttpStatus.OK) {
    notFound();
  }

  return (
    <server.div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <server.div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {spaces.data.map((space) => (
          <SpaceCard key={space.id} space={space} />
        ))}
      </server.div>
    </server.div>
  );
}
