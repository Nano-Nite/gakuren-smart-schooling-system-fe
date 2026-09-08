export const approvalReferenceId = value => typeof value === "object"
  ? value?.education_level_uuid || value?.uuid || ""
  : /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(value)) ? value : "";

export async function resolveApprovalReference(fetchReference, type, options, requiredIds) {
  let result = [];
  try {
    result = (await fetchReference(type, options)).result;
    const missing = [...new Set(requiredIds)].filter(uuid => !result.some(item => item.uuid === uuid && (item.abbr_name || item.code || item.name)));
    if (missing.length && type === "title") {
      const responses = await Promise.all(missing.map(uuid => fetchReference(type, { ...options, uuid, forceRefresh: true })));
      result = [...new Map([...result, ...responses.flatMap(response => response.result)].map(item => [item.uuid, item])).values()];
    } else if (missing.length && !options.forceRefresh) {
      result = (await fetchReference(type, { ...options, forceRefresh: true })).result;
    }
    return { result, failed: false };
  } catch (error) {
    if (error.name === "AbortError" || options.signal?.aborted) throw error;
    return { result, failed: true };
  }
}
