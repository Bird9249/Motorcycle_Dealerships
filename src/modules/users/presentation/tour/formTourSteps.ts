import type { Step } from "react-joyride";

export const userFormTourSteps: Step[] = [
  {
    target: "body",
    content: "ຍິນດີຕ້ອນຮັບສູ່ຟອມສ້າງ/ແກ້ໄຂຜູ້ໃຊ້! ທ່ານຈະໄດ້ຮຽນຮູ້ວິທີໃຊ້ງານຟອມນີ້ໃນບົດສອນສັ້ນໆນີ້.",
    placement: "center",
    skipBeacon: true,
  },
  {
    target: '[data-tourid="form-avatar"]',
    content:
      "ນີ້ແມ່ນການອັບໂຫຼດຮູບໂປຣໄຟລ໌. ທ່ານສາມາດອັບໂຫຼດຮູບຂອງຜູ້ໃຊ້ໄດ້ (ບໍ່ບັງຄັບ). ຮູບຈະຖືກສະແດງໃນຕາຕະລາງຜູ້ໃຊ້.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="form-email"]',
    content: "ນີ້ແມ່ນຊ່ອງອີເມວ. ກະລຸນາໃສ່ອີເມວທີ່ຖືກຕ້ອງ ເພື່ອໃຊ້ເປັນຊື່ຜູ້ໃຊ້ໃນການເຂົ້າສູ່ລະບົບ.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="form-name"]',
    content: "ນີ້ແມ່ນຊ່ອງຊື່. ກະລຸນາໃສ່ຊື່ທີ່ຊັດເຈນຂອງຜູ້ໃຊ້. ຊື່ນີ້ຈະຖືກສະແດງໃນຕາຕະລາງຜູ້ໃຊ້.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="form-password"]',
    content:
      "ນີ້ແມ່ນຊ່ອງລະຫັດຜ່ານ. ຖ້າສ້າງຜູ້ໃຊ້ໃໝ່, ຕ້ອງໃສ່ລະຫັດຜ່ານຢ່າງນ້ອຍ 6 ຕົວອັກສອນ. ຖ້າແກ້ໄຂຜູ້ໃຊ້, ຖ້າບໍ່ໃສ່ລະຫັດຜ່ານໃໝ່, ລະຫັດຜ່ານເກົ່າຈະຍັງຄົງຄ້າງ.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="form-role"]',
    content:
      "ນີ້ແມ່ນການເລືອກບົດບາດ. ທ່ານຕ້ອງເລືອກບົດບາດທີ່ເໝາະສົມກັບຜູ້ໃຊ້. ບົດບາດຈະກຳນົດສິດການເຂົ້າເຖິງຂອງຜູ້ໃຊ້ໃນລະບົບ.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="form-submit"]',
    content:
      "ຫຼັງຈາກຕື່ມຂໍ້ມູນຄົບຖ້ວນແລ້ວ, ກົດປຸ່ມ 'ບັນທຶກ' ເພື່ອບັນທຶກຜູ້ໃຊ້. ຜູ້ໃຊ້ທີ່ບັນທຶກແລ້ວຈະສາມາດເຂົ້າໃຊ້ລະບົບໄດ້ທັນທີ.",
    placement: "top",
  },
];
