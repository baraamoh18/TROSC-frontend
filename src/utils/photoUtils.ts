export const isDefaultPhoto = (url: string | null | undefined): boolean => {
  if (!url) return true;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes("ui-avatars.com") || 
    lowerUrl.includes("placehold.co") || 
    lowerUrl.includes("default") || 
    lowerUrl.includes("instructor-profile") ||
    lowerUrl.includes("trosc+user")
  );
};
