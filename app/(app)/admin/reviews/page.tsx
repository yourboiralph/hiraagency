import { redirect } from "next/navigation";

/**
 * Reviews moved to `/reviews` so project leads can reach them too. Keep this
 * redirect for bookmarks and older links.
 */
export default function AdminReviewsRedirect() {
  redirect("/reviews");
}
