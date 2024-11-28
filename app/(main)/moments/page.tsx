import { HttpStatus } from "@/actions/response";
import { getMoments } from "@/actions/moment/primitives";
import MomentTimeline from "@/app/(main)/components/moment-timeline";

export default async function MomentsPage() {
  try {
    const response = await getMoments({});

    if (response.status === HttpStatus.OK) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
          <MomentTimeline moments={response.data} />
        </div>
      );
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-red-600">모먼트를 불러오는데 실패했습니다.</div>
        </div>
      );
    }
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">예기치 못한 오류가 발생했습니다.</div>
      </div>
    );
  }
}
