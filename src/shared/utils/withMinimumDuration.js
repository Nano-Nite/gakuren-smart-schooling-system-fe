export const withMinimumDuration = async (operation, milliseconds = 5000) => {
  const [result] = await Promise.allSettled([
    Promise.resolve().then(operation),
    new Promise(resolve => window.setTimeout(resolve, milliseconds)),
  ]);
  if (result.status === "rejected") throw result.reason;
  return result.value;
};
