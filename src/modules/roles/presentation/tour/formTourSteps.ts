import type { Step } from "react-joyride";

export const roleFormTourSteps: Step[] = [
  {
    target: "body",
    content: "ຍິນດີຕ້ອນຮັບສູ່ຟອມສ້າງ/ແກ້ໄຂບົດບາດ! ທ່ານຈະໄດ້ຮຽນຮູ້ວິທີໃຊ້ງານຟອມນີ້ໃນບົດສອນສັ້ນໆນີ້.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tourid="form-name"]',
    content:
      "ນີ້ແມ່ນຊ່ອງຊື່ບົດບາດ. ກະລຸນາໃສ່ຊື່ທີ່ຊັດເຈນແລະອະທິບາຍວ່າບົດບາດນີ້ໃຊ້ສຳລັບຫຍັງ. ຕົວຢ່າງ: 'Admin', 'Manager', 'User'.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="form-description"]',
    content:
      "ນີ້ແມ່ນຊ່ອງຄຳອະທິບາຍ. ທ່ານສາມາດໃສ່ຄຳອະທິບາຍເພີ່ມເຕີມກ່ຽວກັບບົດບາດນີ້ (ບໍ່ບັງຄັບ). ຄຳອະທິບາຍຈະຊ່ວຍໃຫ້ຜູ້ໃຊ້ອື່ນເຂົ້າໃຈຈຸດປະສົງຂອງບົດບາດນີ້.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="form-permissions-search"]',
    content: "ນີ້ແມ່ນຊ່ອງຄົ້ນຫາສິດທິ. ທ່ານສາມາດຄົ້ນຫາສິດທິຕາມຊື່ resource ຫຼື action ໄດ້.",
    placement: "bottom",
  },
  {
    target: '[data-tourid="form-permissions"]',
    content:
      "ນີ້ແມ່ນພາກການເລືອກສິດທິ. ທ່ານສາມາດເລືອກສິດທິທີ່ຕ້ອງການໂດຍການຂະຫຍາຍແຕ່ລະ resource group ແລະເລືອກສິດທິທີ່ຕ້ອງການ. ທ່ານສາມາດເລືອກທັງກຸ່ມໂດຍການເລືອກ checkbox ທີ່ຢູ່ຂ້າງຊື່ resource. Badge ຈະສະແດງຈຳນວນສິດທິທີ່ເລືອກແລ້ວ/ທັງໝົດ.",
    placement: "top",
  },
  {
    target: '[data-tourid="form-submit"]',
    content:
      "ຫຼັງຈາກຕື່ມຂໍ້ມູນຄົບຖ້ວນແລ້ວ, ກົດປຸ່ມ 'ບັນທຶກ' ເພື່ອບັນທຶກບົດບາດ. ບົດບາດທີ່ບັນທຶກແລ້ວຈະສາມາດໃຊ້ງານໄດ້ທັນທີ.",
    placement: "top",
  },
];
