import { HttpStatus } from "@/actions/response";
import { getMoment } from "@/actions/moment/primitives";
import { formatDate } from "@/lib/utils";

export async function Moment({ id }: { id: string }) {
  const moment = await getMoment({ id });

  if (moment.status !== HttpStatus.OK) {
    return <div>Moment not found</div>;
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold">{moment.data.title}</h3>
        <p className="text-sm text-gray-500">{moment.data.author}</p>
        <p className="text-sm text-gray-500">{formatDate(moment.data.createdAt)}</p>
      </div>
      <p className="text-pretty break-keep leading-relaxed line-clamp-3">
        {moment.data.content}
      </p>
    </div>
  );
}
