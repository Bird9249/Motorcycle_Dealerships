import { confirm, toast } from "@devhop/ui";

type ApiErrorShape = { message?: string; error?: string } | null;

async function parseJsonSafe(res: Response): Promise<ApiErrorShape> {
  try {
    return await res.clone().json();
  } catch {
    return null;
  }
}

export async function handleError(res: Response): Promise<never> {
  const data = await parseJsonSafe(res);
  const status = res.status;
  const message =
    (data && (data.message || data.error)) ||
    (status === 401
      ? "ບໍ່ໄດ້ຮັບອະນຸຍາດ"
      : status === 403
        ? "ບໍ່ອະນຸຍາດ"
        : status >= 500
          ? "ຜິດພາດທີ່ເຊີບເວີ"
          : "ຄໍາຮ້ອງຂໍລົ້ມເຫຼວ");

  if (status === 401) {
    const ok = await confirm({
      title: "ເຊດຊັນໝົດອາຍຸ",
      description: "ກະລຸນາເຂົ້າລະບົບໃໝ່ເພື່ອດໍາເນີນການຕໍ່.",
      actionText: "ເຂົ້າລະບົບ",
      ActionProps: {
        variant: "default",
      },
    });
    if (ok) window.location.href = "/auth/login";
  } else if (status === 403) {
    console.error(message);
  } else if (status >= 400 && status < 500) {
    toast.error("ຜິດພາດການຮ້ອງຂໍ", { description: String(message) });
  } else {
    toast.error("ຜິດພາດເຊີບເວີ", { description: String(message) });
  }
  throw new Error(message);
}

async function requestJson<TResponse>(
  url: string,
  init: RequestInit,
): Promise<TResponse> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return handleError(res);
    return (await res.json()) as TResponse;
  } catch (e) {
    toast.error("ເຄືອຂ່າຍມີບັນຫາ", {
      description: "ກະລຸນາກວດກາໄຟອິນເຕີເນັດຂອງທ່ານ.",
    });
    throw e;
  }
}

export const fetcher = {
  get: async <TResponse>(
    url: string,
    _?: Record<string, unknown>,
  ): Promise<TResponse> => {
    return requestJson<TResponse>(url, { credentials: "include" });
  },
  postForm: async <TResponse>(
    url: string,
    body: FormData,
  ): Promise<TResponse> => {
    return requestJson<TResponse>(url, {
      method: "POST",
      body,
      credentials: "include",
    });
  },
  post: async <TResponse>(url: string, body?: unknown): Promise<TResponse> => {
    return requestJson<TResponse>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      credentials: "include",
    });
  },
  put: async <TResponse>(url: string, body?: unknown): Promise<TResponse> => {
    return requestJson<TResponse>(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      credentials: "include",
    });
  },
  putForm: async <TResponse>(
    url: string,
    body: FormData,
  ): Promise<TResponse> => {
    return requestJson<TResponse>(url, {
      method: "PUT",
      body,
      credentials: "include",
    });
  },
  patch: async <TResponse>(url: string, body?: unknown): Promise<TResponse> => {
    return requestJson<TResponse>(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      credentials: "include",
    });
  },
  patchForm: async <TResponse>(
    url: string,
    body: FormData,
  ): Promise<TResponse> => {
    return requestJson<TResponse>(url, {
      method: "PATCH",
      body,
      credentials: "include",
    });
  },
  delete: async <TResponse>(url: string): Promise<TResponse> => {
    return requestJson<TResponse>(url, {
      method: "DELETE",
      credentials: "include",
    });
  },
};
