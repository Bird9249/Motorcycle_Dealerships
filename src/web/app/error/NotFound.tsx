import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-2 font-semibold text-2xl">ບໍ່ພົບໜ້າທີ່ຮ້ອງຂໍ</h1>
      <p className="mb-4 text-muted-foreground">ໜ້າທີ່ທ່ານຊອກຫາບໍ່ມີຢູ່.</p>
      <Link to="/" className="underline">
        ກັບໄປໜ້າຫຼັກ
      </Link>
    </div>
  );
}
