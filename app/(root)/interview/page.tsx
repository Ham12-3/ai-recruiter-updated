import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import React from "react";

const Page = async () => {
  const user = await getCurrentUser();

  // If no user is found, show a message instead of the Agent component
  if (!user) {
    return <h3>Please sign in to continue</h3>;
  }

  return (
    <>
      <h3>Interview Generation</h3>
      <Agent userName={user.name || "User"} userId={user.id} type="generate" />
    </>
  );
};

export default Page;
