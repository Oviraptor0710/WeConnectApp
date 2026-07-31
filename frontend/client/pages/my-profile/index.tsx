import { useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import EditProfileModal from "@/components/EditProfileModal";
import EditHobbiesModal from "@/components/EditHobbiesModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
interface HobbyOut {
  hobby_id: number;
  name: string;
  category: string;
}

interface UserOut {
  user_id: number;
  email: string;
  phone_number?: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  location?: string;
  japanese_level?: string;
  job_title?: string;
  education?: string;
  relationship_status?: string;
  preferred_language?: string;
  role: string;
  is_verified: boolean;
  hobbies: HobbyOut[];
}

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 12H2.56875L9.9 4.66875L8.83125 3.6L1.5 10.9312V12ZM0 13.5V10.3125L9.9 0.43125C10.05 0.29375 10.2156 0.1875 10.3969 0.1125C10.5781 0.0375 10.7688 0 10.9688 0C11.1687 0 11.3625 0.0375 11.55 0.1125C11.7375 0.1875 11.9 0.3 12.0375 0.45L13.0688 1.5C13.2188 1.6375 13.3281 1.8 13.3969 1.9875C13.4656 2.175 13.5 2.3625 13.5 2.55C13.5 2.75 13.4656 2.94062 13.3969 3.12188C13.3281 3.30313 13.2188 3.46875 13.0688 3.61875L3.1875 13.5H0Z" fill="white"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 10.875C8.4375 10.875 9.23438 10.5469 9.89062 9.89062C10.5469 9.23438 10.875 8.4375 10.875 7.5C10.875 6.5625 10.5469 5.76562 9.89062 5.10938C9.23438 4.45312 8.4375 4.125 7.5 4.125C6.5625 4.125 5.76562 4.45312 5.10938 5.10938C4.45312 5.76562 4.125 6.5625 4.125 7.5C4.125 8.4375 4.45312 9.23438 5.10938 9.89062C5.76562 10.5469 6.5625 10.875 7.5 10.875ZM7.5 9.375C6.975 9.375 6.53125 9.19375 6.16875 8.83125C5.80625 8.46875 5.625 8.025 5.625 7.5C5.625 6.975 5.80625 6.53125 6.16875 6.16875C6.53125 5.80625 6.975 5.625 7.5 5.625C8.025 5.625 8.46875 5.80625 8.83125 6.16875C9.19375 6.53125 9.375 6.975 9.375 7.5C9.375 8.025 9.19375 8.46875 8.83125 8.83125C8.46875 9.19375 8.025 9.375 7.5 9.375ZM1.5 13.5C1.0875 13.5 0.734375 13.3531 0.440625 13.0594C0.146875 12.7656 0 12.4125 0 12V3C0 2.5875 0.146875 2.23438 0.440625 1.94062C0.734375 1.64687 1.0875 1.5 1.5 1.5H3.8625L5.25 0H9.75L11.1375 1.5H13.5C13.9125 1.5 14.2656 1.64687 14.5594 1.94062C14.8531 2.23438 15 2.5875 15 3V12C15 12.4125 14.8531 12.7656 14.5594 13.0594C14.2656 13.3531 13.9125 13.5 13.5 13.5H1.5ZM1.5 12H13.5V3H10.4625L9.09375 1.5H5.90625L4.5375 3H1.5V12Z" fill="white"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.66667 5.83333C4.9875 5.83333 5.26215 5.7191 5.49062 5.49062C5.7191 5.26215 5.83333 4.9875 5.83333 4.66667C5.83333 4.34583 5.7191 4.07118 5.49062 3.84271C5.26215 3.61424 4.9875 3.5 4.66667 3.5C4.34583 3.5 4.07118 3.61424 3.84271 3.84271C3.61424 4.07118 3.5 4.34583 3.5 4.66667C3.5 4.9875 3.61424 5.26215 3.84271 5.49062C4.07118 5.7191 4.34583 5.83333 4.66667 5.83333ZM4.66667 10.1208C5.85278 9.03194 6.73264 8.04271 7.30625 7.15312C7.87986 6.26354 8.16667 5.47361 8.16667 4.78333C8.16667 3.72361 7.82882 2.8559 7.15312 2.18021C6.47743 1.50451 5.64861 1.16667 4.66667 1.16667C3.68472 1.16667 2.8559 1.50451 2.18021 2.18021C1.50451 2.8559 1.16667 3.72361 1.16667 4.78333C1.16667 5.47361 1.45347 6.26354 2.02708 7.15312C2.60069 8.04271 3.48056 9.03194 4.66667 10.1208ZM4.66667 11.6667C3.10139 10.3347 1.93229 9.09757 1.15937 7.95521C0.386458 6.81285 0 5.75556 0 4.78333C0 3.325 0.469097 2.16319 1.40729 1.29792C2.34549 0.432639 3.43194 0 4.66667 0C5.90139 0 6.98785 0.432639 7.92604 1.29792C8.86424 2.16319 9.33333 3.325 9.33333 4.78333C9.33333 5.75556 8.94688 6.81285 8.17396 7.95521C7.40104 9.09757 6.23194 10.3347 4.66667 11.6667Z" fill="#6B7280"/>
  </svg>
);

const BioIcon = () => (
  <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 16H12V14H4V16ZM4 12H12V10H4V12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H10L16 6V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 7V2H2V18H14V7H9Z" fill="#4A6741"/>
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.85 14.825L10 12.925L13.15 14.85L12.325 11.25L15.1 8.85L11.45 8.525L10 5.125L8.55 8.5L4.9 8.825L7.675 11.25L6.85 14.825ZM3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z" fill="#4A6741"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 15H11V9H9V15ZM10 7C10.2833 7 10.5208 6.90417 10.7125 6.7125C10.9042 6.52083 11 6.28333 11 6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6C9 6.28333 9.09583 6.52083 9.2875 6.7125C9.47917 6.90417 9.71667 7 10 7ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="#4A6741"/>
  </svg>
);

const PlusCircleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.75 11.25H8.25V8.25H11.25V6.75H8.25V3.75H6.75V6.75H3.75V8.25H6.75V11.25ZM7.5 15C6.4625 15 5.4875 14.8031 4.575 14.4094C3.6625 14.0156 2.86875 13.4812 2.19375 12.8062C1.51875 12.1312 0.984375 11.3375 0.590625 10.425C0.196875 9.5125 0 8.5375 0 7.5C0 6.4625 0.196875 5.4875 0.590625 4.575C0.984375 3.6625 1.51875 2.86875 2.19375 2.19375C2.86875 1.51875 3.6625 0.984375 4.575 0.590625C5.4875 0.196875 6.4625 0 7.5 0C8.5375 0 9.5125 0.196875 10.425 0.590625C11.3375 0.984375 12.1312 1.51875 12.8062 2.19375C13.4812 2.86875 14.0156 3.6625 14.4094 4.575C14.8031 5.4875 15 6.4625 15 7.5C15 8.5375 14.8031 9.5125 14.4094 10.425C14.0156 11.3375 13.4812 12.1312 12.8062 12.8062C12.1312 13.4812 11.3375 14.0156 10.425 14.4094C9.5125 14.8031 8.5375 15 7.5 15ZM7.5 13.5C9.175 13.5 10.5938 12.9188 11.7563 11.7563C12.9188 10.5938 13.5 9.175 13.5 7.5C13.5 5.825 12.9188 4.40625 11.7563 3.24375C10.5938 2.08125 9.175 1.5 7.5 1.5C5.825 1.5 4.40625 2.08125 3.24375 3.24375C2.08125 4.40625 1.5 5.825 1.5 7.5C1.5 9.175 2.08125 10.5938 3.24375 11.7563C4.40625 12.9188 5.825 13.5 7.5 13.5Z" fill="#6B7280"/>
  </svg>
);

const hobbies = [
  {
    label: "UI/UXデザイン",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.5 15C6.475 15 5.50625 14.8031 4.59375 14.4094C3.68125 14.0156 2.88438 13.4781 2.20312 12.7969C1.52188 12.1156 0.984375 11.3188 0.590625 10.4062C0.196875 9.49375 0 8.525 0 7.5C0 6.4625 0.203125 5.4875 0.609375 4.575C1.01562 3.6625 1.56563 2.86875 2.25938 2.19375C2.95312 1.51875 3.7625 0.984375 4.6875 0.590625C5.6125 0.196875 6.6 0 7.65 0C8.65 0 9.59375 0.171875 10.4812 0.515625C11.3687 0.859375 12.1469 1.33437 12.8156 1.94062C13.4844 2.54688 14.0156 3.26563 14.4094 4.09688C14.8031 4.92813 15 5.825 15 6.7875C15 8.225 14.5625 9.32812 13.6875 10.0969C12.8125 10.8656 11.75 11.25 10.5 11.25H9.1125C9 11.25 8.92188 11.2812 8.87813 11.3438C8.83438 11.4062 8.8125 11.475 8.8125 11.55C8.8125 11.7 8.90625 11.9156 9.09375 12.1969C9.28125 12.4781 9.375 12.8 9.375 13.1625C9.375 13.7875 9.20312 14.25 8.85938 14.55C8.51562 14.85 8.0625 15 7.5 15ZM3.375 8.25C3.7 8.25 3.96875 8.14375 4.18125 7.93125C4.39375 7.71875 4.5 7.45 4.5 7.125C4.5 6.8 4.39375 6.53125 4.18125 6.31875C3.96875 6.10625 3.7 6 3.375 6C3.05 6 2.78125 6.10625 2.56875 6.31875C2.35625 6.53125 2.25 6.8 2.25 7.125C2.25 7.45 2.35625 7.71875 2.56875 7.93125C2.78125 8.14375 3.05 8.25 3.375 8.25ZM5.625 5.25C5.95 5.25 6.21875 5.14375 6.43125 4.93125C6.64375 4.71875 6.75 4.45 6.75 4.125C6.75 3.8 6.64375 3.53125 6.43125 3.31875C6.21875 3.10625 5.95 3 5.625 3C5.3 3 5.03125 3.10625 4.81875 3.31875C4.60625 3.53125 4.5 3.8 4.5 4.125C4.5 4.45 4.60625 4.71875 4.81875 4.93125C5.03125 5.14375 5.3 5.25 5.625 5.25ZM9.375 5.25C9.7 5.25 9.96875 5.14375 10.1812 4.93125C10.3937 4.71875 10.5 4.45 10.5 4.125C10.5 3.8 10.3937 3.53125 10.1812 3.31875C9.96875 3.10625 9.7 3 9.375 3C9.05 3 8.78125 3.10625 8.56875 3.31875C8.35625 3.53125 8.25 3.8 8.25 4.125C8.25 4.45 8.35625 4.71875 8.56875 4.93125C8.78125 5.14375 9.05 5.25 9.375 5.25ZM11.625 8.25C11.95 8.25 12.2188 8.14375 12.4312 7.93125C12.6437 7.71875 12.75 7.45 12.75 7.125C12.75 6.8 12.6437 6.53125 12.4312 6.31875C12.2188 6.10625 11.95 6 11.625 6C11.3 6 11.0312 6.10625 10.8188 6.31875C10.6063 6.53125 10.5 6.8 10.5 7.125C10.5 7.45 10.6063 7.71875 10.8188 7.93125C11.0312 8.14375 11.3 8.25 11.625 8.25Z" fill="#4A6741"/>
      </svg>
    ),
  },
  {
    label: "日本語",
    icon: (
      <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.175 15L11.5875 6H13.1625L16.575 15H15L14.1938 12.7125H10.5562L9.75 15H8.175ZM2.25 12.75L1.2 11.7L4.9875 7.9125C4.55 7.475 4.15312 6.975 3.79688 6.4125C3.44062 5.85 3.1125 5.2125 2.8125 4.5H4.3875C4.6375 4.9875 4.8875 5.4125 5.1375 5.775C5.3875 6.1375 5.6875 6.5 6.0375 6.8625C6.45 6.45 6.87813 5.87188 7.32188 5.12813C7.76562 4.38438 8.1 3.675 8.325 3H0V1.5H5.25V0H6.75V1.5H12V3H9.825C9.5625 3.9 9.16875 4.825 8.64375 5.775C8.11875 6.725 7.6 7.45 7.0875 7.95L8.8875 9.7875L8.325 11.325L6.0375 8.98125L2.25 12.75ZM11.025 11.4H13.725L12.375 7.575L11.025 11.4Z" fill="#4A6741"/>
      </svg>
    ),
  },
  {
    label: "茶道",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 13.5V12H12V13.5H0ZM3 10.5C2.175 10.5 1.46875 10.2062 0.88125 9.61875C0.29375 9.03125 0 8.325 0 7.5V0H12C12.4125 0 12.7656 0.146875 13.0594 0.440625C13.3531 0.734375 13.5 1.0875 13.5 1.5V3.75C13.5 4.1625 13.3531 4.51562 13.0594 4.80937C12.7656 5.10312 12.4125 5.25 12 5.25H10.5V7.5C10.5 8.325 10.2062 9.03125 9.61875 9.61875C9.03125 10.2062 8.325 10.5 7.5 10.5H3ZM3 9H7.5C7.9125 9 8.26562 8.85312 8.55937 8.55937C8.85312 8.26562 9 7.9125 9 7.5V1.5H1.5V7.5C1.5 7.9125 1.64687 8.26562 1.94062 8.55937C2.23438 8.85312 2.5875 9 3 9ZM10.5 3.75H12V1.5H10.5V3.75Z" fill="#4A6741"/>
      </svg>
    ),
  },
  {
    label: "写真",
    icon: (
      <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.5 10.875C8.4375 10.875 9.23438 10.5469 9.89062 9.89062C10.5469 9.23438 10.875 8.4375 10.875 7.5C10.875 6.5625 10.5469 5.76562 9.89062 5.10938C9.23438 4.45312 8.4375 4.125 7.5 4.125C6.5625 4.125 5.76562 4.45312 5.10938 5.10938C4.45312 5.76562 4.125 6.5625 4.125 7.5C4.125 8.4375 4.45312 9.23438 5.10938 9.89062C5.76562 10.5469 6.5625 10.875 7.5 10.875ZM7.5 9.375C6.975 9.375 6.53125 9.19375 6.16875 8.83125C5.80625 8.46875 5.625 8.025 5.625 7.5C5.625 6.975 5.80625 6.53125 6.16875 6.16875C6.53125 5.80625 6.975 5.625 7.5 5.625C8.025 5.625 8.46875 5.80625 8.83125 6.16875C9.19375 6.53125 9.375 6.975 9.375 7.5C9.375 8.025 9.19375 8.46875 8.83125 8.83125C8.46875 9.19375 8.025 9.375 7.5 9.375ZM1.5 13.5C1.0875 13.5 0.734375 13.3531 0.440625 13.0594C0.146875 12.7656 0 12.4125 0 12V3C0 2.5875 0.146875 2.23438 0.440625 1.94062C0.734375 1.64687 1.0875 1.5 1.5 1.5H3.8625L5.25 0H9.75L11.1375 1.5H13.5C13.9125 1.5 14.2656 1.64687 14.5594 1.94062C14.8531 2.23438 15 2.5875 15 3V12C15 12.4125 14.8531 12.7656 14.5594 13.0594C14.2656 13.3531 13.9125 13.5 13.5 13.5H1.5ZM1.5 12H13.5V3H10.4625L9.09375 1.5H5.90625L4.5375 3H1.5V12Z" fill="#4A6741"/>
      </svg>
    ),
  },
  {
    label: "旅行",
    icon: (
      <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.5 15C6.4625 15 5.4875 14.8031 4.575 14.4094C3.6625 14.0156 2.86875 13.4812 2.19375 12.8062C1.51875 12.1312 0.984375 11.3375 0.590625 10.425C0.196875 9.5125 0 8.5375 0 7.5C0 6.4625 0.196875 5.4875 0.590625 4.575C0.984375 3.6625 1.51875 2.86875 2.19375 2.19375C2.86875 1.51875 3.6625 0.984375 4.575 0.590625C5.4875 0.196875 6.4625 0 7.5 0C9.325 0 10.9219 0.571875 12.2906 1.71563C13.6594 2.85938 14.5125 4.29375 14.85 6.01875H13.3125C13.075 5.10625 12.6469 4.29063 12.0281 3.57188C11.4094 2.85313 10.65 2.3125 9.75 1.95V2.25C9.75 2.6625 9.60312 3.01562 9.30937 3.30938C9.01562 3.60313 8.6625 3.75 8.25 3.75H6.75V5.25C6.75 5.4625 6.67813 5.64062 6.53438 5.78438C6.39062 5.92813 6.2125 6 6 6H4.5V7.5H6V9.75H5.25L1.65 6.15C1.6125 6.375 1.57812 6.6 1.54688 6.825C1.51562 7.05 1.5 7.275 1.5 7.5C1.5 9.1375 2.075 10.5437 3.225 11.7188C4.375 12.8938 5.8 13.4875 7.5 13.5V15ZM14.325 14.625L11.925 12.225C11.6625 12.375 11.3813 12.5 11.0813 12.6C10.7812 12.7 10.4625 12.75 10.125 12.75C9.1875 12.75 8.39062 12.4219 7.73438 11.7656C7.07812 11.1094 6.75 10.3125 6.75 9.375C6.75 8.4375 7.07812 7.64062 7.73438 6.98438C8.39062 6.32812 9.1875 6 10.125 6C11.0625 6 11.8594 6.32812 12.5156 6.98438C13.1719 7.64062 13.5 8.4375 13.5 9.375C13.5 9.7125 13.45 10.0312 13.35 10.3313C13.25 10.6313 13.125 10.9125 12.975 11.175L15.375 13.575L14.325 14.625ZM10.125 11.25C10.65 11.25 11.0938 11.0688 11.4563 10.7063C11.8188 10.3438 12 9.9 12 9.375C12 8.85 11.8188 8.40625 11.4563 8.04375C11.0938 7.68125 10.65 7.5 10.125 7.5C9.6 7.5 9.15625 7.68125 8.79375 8.04375C8.43125 8.40625 8.25 8.85 8.25 9.375C8.25 9.9 8.43125 10.3438 8.79375 10.7063C9.15625 11.0688 9.6 11.25 10.125 11.25Z" fill="#4A6741"/>
      </svg>
    ),
  },
  {
    label: "読書",
    icon: (
      <svg width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.75 4.425V3.15C10.1625 2.975 10.5844 2.84375 11.0156 2.75625C11.4469 2.66875 11.9 2.625 12.375 2.625C12.7 2.625 13.0188 2.65 13.3313 2.7C13.6438 2.75 13.95 2.8125 14.25 2.8875V4.0875C13.95 3.975 13.6469 3.89062 13.3406 3.83437C13.0344 3.77812 12.7125 3.75 12.375 3.75C11.9 3.75 11.4438 3.80937 11.0063 3.92812C10.5688 4.04688 10.15 4.2125 9.75 4.425ZM9.75 8.55V7.275C10.1625 7.1 10.5844 6.96875 11.0156 6.88125C11.4469 6.79375 11.9 6.75 12.375 6.75C12.7 6.75 13.0188 6.775 13.3313 6.825C13.6438 6.875 13.95 6.9375 14.25 7.0125V8.2125C13.95 8.1 13.6469 8.01562 13.3406 7.95937C13.0344 7.90312 12.7125 7.875 12.375 7.875C11.9 7.875 11.4438 7.93125 11.0063 8.04375C10.5688 8.15625 10.15 8.325 9.75 8.55ZM9.75 6.4875V5.2125C10.1625 5.0375 10.5844 4.90625 11.0156 4.81875C11.4469 4.73125 11.9 4.6875 12.375 4.6875C12.7 4.6875 13.0188 4.7125 13.3313 4.7625C13.6438 4.8125 13.95 4.875 14.25 4.95V6.15C13.95 6.0375 13.6469 5.95312 13.3406 5.89687C13.0344 5.84062 12.7125 5.8125 12.375 5.8125C11.9 5.8125 11.4438 5.87187 11.0063 5.99062C10.5688 6.10938 10.15 6.275 9.75 6.4875ZM4.125 9C4.7125 9 5.28437 9.06562 5.84062 9.19687C6.39687 9.32812 6.95 9.525 7.5 9.7875V2.4C6.9875 2.1 6.44375 1.875 5.86875 1.725C5.29375 1.575 4.7125 1.5 4.125 1.5C3.675 1.5 3.22812 1.54375 2.78437 1.63125C2.34063 1.71875 1.9125 1.85 1.5 2.025V9.45C1.9375 9.3 2.37187 9.1875 2.80312 9.1125C3.23438 9.0375 3.675 9 4.125 9ZM9 9.7875C9.55 9.525 10.1031 9.32812 10.6594 9.19687C11.2156 9.06562 11.7875 9 12.375 9C12.825 9 13.2656 9.0375 13.6969 9.1125C14.1281 9.1875 14.5625 9.3 15 9.45V2.025C14.5875 1.85 14.1594 1.71875 13.7156 1.63125C13.2719 1.54375 12.825 1.5 12.375 1.5C11.7875 1.5 11.2063 1.575 10.6313 1.725C10.0563 1.875 9.5125 2.1 9 2.4V9.7875ZM8.25 12C7.65 11.525 7 11.1562 6.3 10.8938C5.6 10.6313 4.875 10.5 4.125 10.5C3.6 10.5 3.08437 10.5688 2.57812 10.7063C2.07188 10.8438 1.5875 11.0375 1.125 11.2875C0.8625 11.425 0.609375 11.4187 0.365625 11.2688C0.121875 11.1188 0 10.9 0 10.6125V1.575C0 1.4375 0.034375 1.30625 0.103125 1.18125C0.171875 1.05625 0.275 0.9625 0.4125 0.9C0.9875 0.6 1.5875 0.375 2.2125 0.225C2.8375 0.075 3.475 0 4.125 0C4.85 0 5.55938 0.09375 6.25313 0.28125C6.94688 0.46875 7.6125 0.75 8.25 1.125C8.8875 0.75 9.55312 0.46875 10.2469 0.28125C10.9406 0.09375 11.65 0 12.375 0C13.025 0 13.6625 0.075 14.2875 0.225C14.9125 0.375 15.5125 0.6 16.0875 0.9C16.225 0.9625 16.3281 1.05625 16.3969 1.18125C16.4656 1.30625 16.5 1.4375 16.5 1.575V10.6125C16.5 10.9 16.3781 11.1188 16.1344 11.2688C15.8906 11.4187 15.6375 11.425 15.375 11.2875C14.9125 11.0375 14.4281 10.8438 13.9219 10.7063C13.4156 10.5688 12.9 10.5 12.375 10.5C11.625 10.5 10.9 10.6313 10.2 10.8938C9.5 11.1562 8.85 11.525 8.25 12Z" fill="#4A6741"/>
      </svg>
    ),
  },
];

const basicInfo = [
  {
    icon: (
      <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.66667 15.8333C1.20833 15.8333 0.815972 15.6701 0.489583 15.3438C0.163194 15.0174 0 14.625 0 14.1667V5C0 4.54167 0.163194 4.14931 0.489583 3.82292C0.815972 3.49653 1.20833 3.33333 1.66667 3.33333H5V1.66667C5 1.20833 5.16319 0.815972 5.48958 0.489583C5.81597 0.163194 6.20833 0 6.66667 0H10C10.4583 0 10.8507 0.163194 11.1771 0.489583C11.5035 0.815972 11.6667 1.20833 11.6667 1.66667V3.33333H15C15.4583 3.33333 15.8507 3.49653 16.1771 3.82292C16.5035 4.14931 16.6667 4.54167 16.6667 5V14.1667C16.6667 14.625 16.5035 15.0174 16.1771 15.3438C15.8507 15.6701 15.4583 15.8333 15 15.8333H1.66667ZM1.66667 14.1667H15V5H1.66667V14.1667ZM6.66667 3.33333H10V1.66667H6.66667V3.33333Z" fill="#6B7280"/>
      </svg>
    ),
    title: "UI/UX Designer",
    subtitle: "UI/UX Designer tại WeConnect",
  },
  {
    icon: (
      <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.16667 15L3.33333 11.8333V6.83333L0 5L9.16667 0L18.3333 5V11.6667H16.6667V5.91667L15 6.83333V11.8333L9.16667 15ZM9.16667 8.08333L14.875 5L9.16667 1.91667L3.45833 5L9.16667 8.08333ZM9.16667 13.1042L13.3333 10.8542V7.70833L9.16667 10L5 7.70833V10.8542L9.16667 13.1042Z" fill="#6B7280"/>
      </svg>
    ),
    title: "Đại học FPT",
    subtitle: "Chuyên ngành Thiết kế đồ họa",
  },
  {
    icon: (
      <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.33333 15.2917L7.125 14.2083C5.72222 12.9444 4.5625 11.8542 3.64583 10.9375C2.72917 10.0208 2 9.19792 1.45833 8.46875C0.916667 7.73958 0.538194 7.06944 0.322917 6.45833C0.107639 5.84722 0 5.22222 0 4.58333C0 3.27778 0.4375 2.1875 1.3125 1.3125C2.1875 0.4375 3.27778 0 4.58333 0C5.30556 0 5.99306 0.152778 6.64583 0.458333C7.29861 0.763889 7.86111 1.19444 8.33333 1.75C8.80556 1.19444 9.36806 0.763889 10.0208 0.458333C10.6736 0.152778 11.3611 0 12.0833 0C13.3889 0 14.4792 0.4375 15.3542 1.3125C16.2292 2.1875 16.6667 3.27778 16.6667 4.58333C16.6667 5.22222 16.559 5.84722 16.3438 6.45833C16.1285 7.06944 15.75 7.73958 15.2083 8.46875C14.6667 9.19792 13.9375 10.0208 13.0208 10.9375C12.1042 11.8542 10.9444 12.9444 9.54167 14.2083L8.33333 15.2917Z" fill="#6B7280"/>
      </svg>
    ),
    title: "Độc thân",
    subtitle: "Tình trạng quan hệ",
  },
  {
    icon: (
      <svg width="19" height="14" viewBox="0 0 19 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 13.3333V11C0 10.5278 0.121528 10.0938 0.364583 9.69792C0.607639 9.30208 0.930556 9 1.33333 8.79167C2.19444 8.36111 3.06944 8.03819 3.95833 7.82292C4.84722 7.60764 5.75 7.5 6.66667 7.5C7.58333 7.5 8.48611 7.60764 9.375 7.82292C10.2639 8.03819 11.1389 8.36111 12 8.79167C12.4028 9 12.7257 9.30208 12.9688 9.69792C13.2118 10.0938 13.3333 10.5278 13.3333 11V13.3333H0ZM15 13.3333V10.8333C15 10.2222 14.8299 9.63542 14.4896 9.07292C14.1493 8.51042 13.6667 8.02778 13.0417 7.625C13.75 7.70833 14.4167 7.85069 15.0417 8.05208C15.6667 8.25347 16.25 8.5 16.7917 8.79167C17.2917 9.06944 17.6736 9.37847 17.9375 9.71875C18.2014 10.059 18.3333 10.4306 18.3333 10.8333V13.3333H15ZM6.66667 6.66667C5.75 6.66667 4.96528 6.34028 4.3125 5.6875C3.65972 5.03472 3.33333 4.25 3.33333 3.33333C3.33333 2.41667 3.65972 1.63194 4.3125 0.979167C4.96528 0.326389 5.75 0 6.66667 0C7.58333 0 8.36806 0.326389 9.02083 0.979167C9.67361 1.63194 10 2.41667 10 3.33333C10 4.25 9.67361 5.03472 9.02083 5.6875C8.36806 6.34028 7.58333 6.66667 6.66667 6.66667ZM1.66667 11.6667H11.6667V11C11.6667 10.8472 11.6285 10.7083 11.5521 10.5833C11.4757 10.4583 11.375 10.3611 11.25 10.2917C10.5 9.91667 9.74306 9.63542 8.97917 9.44792C8.21528 9.26042 7.44444 9.16667 6.66667 9.16667C5.88889 9.16667 5.11806 9.26042 4.35417 9.44792C3.59028 9.63542 2.83333 9.91667 2.08333 10.2917C1.95833 10.3611 1.85764 10.4583 1.78125 10.5833C1.70486 10.7083 1.66667 10.8472 1.66667 11V11.6667ZM6.66667 5C7.125 5 7.51736 4.83681 7.84375 4.51042C8.17014 4.18403 8.33333 3.79167 8.33333 3.33333C8.33333 2.875 8.17014 2.48264 7.84375 2.15625C7.51736 1.82986 7.125 1.66667 6.66667 1.66667C6.20833 1.66667 5.81597 1.82986 5.48958 2.15625C5.16319 2.48264 5 2.875 5 3.33333C5 3.79167 5.16319 4.18403 5.48958 4.51042C5.81597 4.83681 6.20833 5 6.66667 5Z" fill="#6B7280"/>
      </svg>
    ),
    title: "1.2k Bạn bè",
    subtitle: null,
    friends: true,
  },
];

export default function Index() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditHobbiesOpen, setIsEditHobbiesOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<UserOut>("/api/v1/users/me"),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiFetch("/api/v1/users/me/avatar", {
        method: "PUT",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast({ title: t("profile.success"), description: t("profile.avatarUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("profile.error"), description: error.message, variant: "destructive" });
    },
  });

  const coverMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiFetch("/api/v1/users/me/cover", {
        method: "PUT",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast({ title: t("profile.success"), description: t("profile.coverUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("profile.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleAvatarClick = () => avatarInputRef.current?.click();
  const handleCoverClick = () => coverInputRef.current?.click();

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
  };

  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) coverMutation.mutate(file);
  };

  const formatDateOfBirth = (value?: string) => {
    if (!value) return t("profile.notUpdated");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("vi-VN").format(date);
  };

  const getGenderLabel = (gender?: string) => {
    if (!gender) return t("profile.notUpdated");
    if (gender === "MALE") return t("profile.male");
    if (gender === "FEMALE") return t("profile.female");
    if (gender === "OTHER") return t("profile.other");
    return gender;
  };

  const getRelationshipLabel = (status?: string) => {
    if (!status) return t("profile.notUpdated");
    if (status === "Độc thân") return t("profile.single");
    if (status === "Đang hẹn hò") return t("profile.dating");
    if (status === "Đã kết hôn") return t("profile.married");
    if (status === "Khác") return t("profile.other");
    return status;
  };

  const basicInfoItems = [
    {
      icon: basicInfo[0].icon,
      title: data?.job_title || t("profile.notUpdated"),
      subtitle: t("profile.job"),
    },
    {
      icon: basicInfo[1].icon,
      title: data?.education || t("profile.notUpdated"),
      subtitle: t("profile.education"),
    },
    {
      icon: basicInfo[2].icon,
      title: getRelationshipLabel(data?.relationship_status),
      subtitle: t("profile.relationshipStatus"),
    },
    {
      icon: basicInfo[3].icon,
      title: data?.japanese_level || t("profile.notUpdated"),
      subtitle: t("profile.japaneseLevel"),
    },
    {
      icon: basicInfo[0].icon,
      title: getGenderLabel(data?.gender),
      subtitle: t("profile.gender"),
    },
    {
      icon: basicInfo[1].icon,
      title: formatDateOfBirth(data?.date_of_birth),
      subtitle: t("profile.dateOfBirth"),
    },
    {
      icon: basicInfo[2].icon,
      title: data?.phone_number || t("profile.notUpdated"),
      subtitle: t("profile.phoneNumber"),
    },
  ];

  return (
    <div className="min-h-screen bg-wc-bg font-['Inter']">
      <Navbar />
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-wc-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Profile section */}
      <div className="border-b border-wc-border bg-white">
        {/* Cover photo */}
        <div className="relative h-[280px] sm:h-[320px] overflow-hidden">
          <input
            type="file"
            ref={coverInputRef}
            className="hidden"
            accept="image/*"
            onChange={onCoverChange}
          />
          <div
            className="absolute inset-0"
            style={{
              background: data?.cover_url 
                ? "none" 
                : "linear-gradient(45deg, #1A2A2A 0%, #4A6741 50%, #60A5FA 100%)",
              opacity: 0.9,
            }}
          />
          {data?.cover_url ? (
            <img
              src={data.cover_url.startsWith("/") ? `${import.meta.env.VITE_API_URL}${data.cover_url}` : data.cover_url}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/22a10440c4664dcb444f0ede2674a8c47531d829?width=2560"
              alt="Cover placeholder"
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
            />
          )}
          {/* Change cover button */}
          <button 
            onClick={handleCoverClick}
            disabled={coverMutation.isPending}
            className="absolute bottom-4 right-4 sm:right-6 flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/30 bg-white/20 backdrop-blur-sm text-white text-sm font-bold hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            {coverMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CameraIcon />
            )}
            <span className="hidden sm:inline">
              {coverMutation.isPending ? t("profile.loading") : t("profile.changeCover")}
            </span>
          </button>
        </div>

        {/* Profile info row */}
        <div className="max-w-[1152px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 sm:-mt-20 shrink-0">
              <input
                type="file"
                ref={avatarInputRef}
                className="hidden"
                accept="image/*"
                onChange={onAvatarChange}
              />
              <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-white shadow-2xl p-1.5">
                <img
                  src={data?.avatar_url 
                    ? (data.avatar_url.startsWith("/") ? `${import.meta.env.VITE_API_URL}${data.avatar_url}` : data.avatar_url)
                    : "https://api.builder.io/api/v1/image/assets/TEMP/20ea1fd7bbc4891a762df33546498dfbd9f22f42?width=328"
                  }
                  alt="User avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <button 
                onClick={handleAvatarClick}
                disabled={avatarMutation.isPending}
                className="absolute bottom-0 right-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-wc-green/80 border border-white/30 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-wc-green transition-colors disabled:opacity-50"
              >
                {avatarMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <EditIcon />
                )}
              </button>
            </div>

            {/* Name + info */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-0 flex-1 pt-2 sm:pt-4 w-full">
              <div className="flex flex-col gap-2 flex-1">
                <h1 className="text-3xl sm:text-[36px] font-black text-wc-dark leading-tight">
                  {data?.full_name ?? "Nguyễn Văn An"}
                </h1>
                <div className="flex items-center gap-2">
                  <LocationIcon />
                  <span className="text-wc-gray text-base font-medium">
                    {data?.location ? t(`locations.${data.location}`, { defaultValue: data.location }) : t("profile.locationNotUpdated")}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-wc-gray/40" />
                </div>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-3 rounded-2xl border border-wc-dark/10 bg-white/10 backdrop-blur-sm shadow-sm text-wc-dark hover:bg-wc-light-green transition-colors shrink-0" title="Change Language">
                      <Globe className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 font-['Inter']">
                    <DropdownMenuItem onClick={() => i18n.changeLanguage('vi')} className={i18n.language === 'vi' ? "bg-wc-light-green text-wc-green font-bold" : ""}>
                      Tiếng Việt
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => i18n.changeLanguage('ja')} className={i18n.language === 'ja' ? "bg-wc-light-green text-wc-green font-bold" : ""}>
                      日本語
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button 
                  onClick={() => setIsEditProfileOpen(true)}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-2xl border border-wc-dark/10 bg-white/10 backdrop-blur-sm shadow-sm text-wc-dark font-bold text-sm sm:text-base hover:bg-wc-light-green transition-colors text-center"
                >
                  {t("profile.editProfile")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1152px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Bio card */}
            <div className="bg-white rounded-2xl border border-wc-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BioIcon />
                  <h3 className="text-wc-dark font-bold text-xl">{t("profile.bio")}</h3>
                </div>
                <button 
                  onClick={() => setIsEditProfileOpen(true)}
                  className="text-wc-gray hover:text-wc-green transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 12H2.56875L9.9 4.66875L8.83125 3.6L1.5 10.9312V12ZM0 13.5V10.3125L9.9 0.43125C10.05 0.29375 10.2156 0.1875 10.3969 0.1125C10.5781 0.0375 10.7688 0 10.9688 0C11.1687 0 11.3625 0.0375 11.55 0.1125C11.7375 0.1875 11.9 0.3 12.0375 0.45L13.0688 1.5C13.2188 1.6375 13.3281 1.8 13.3969 1.9875C13.4656 2.175 13.5 2.3625 13.5 2.55C13.5 2.75 13.4656 2.94062 13.3969 3.12188C13.3281 3.30313 13.2188 3.46875 13.0688 3.61875L3.1875 13.5H0Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
              <p className="text-wc-gray text-base leading-relaxed">
                {data?.bio ?? t("profile.bioPlaceholder")}
              </p>
            </div>

            {/* Hobbies card */}
            <div className="bg-white rounded-2xl border border-wc-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <StarIcon />
                  <h3 className="text-wc-dark font-bold text-xl">{t("profile.hobbies")}</h3>
                </div>
                <button 
                  onClick={() => setIsEditHobbiesOpen(true)}
                  className="text-wc-gray hover:text-wc-green transition-colors"
                >
                  <PlusCircleIcon />
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {data?.hobbies && data.hobbies.length > 0
                  ? data.hobbies.map((hobby) => (
                      <div
                        key={hobby.hobby_id}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-wc-light-green border border-wc-green/10 shadow-sm"
                      >
                        <span className="text-wc-green text-sm font-semibold">{t(`hobbiesList.${hobby.name}`, { defaultValue: hobby.name })}</span>
                      </div>
                    ))
                  : hobbies.map(({ label, icon }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-wc-light-green border border-wc-green/10 shadow-sm"
                      >
                        {icon}
                        <span className="text-wc-green text-sm font-semibold">{label}</span>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-wc-border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <InfoIcon />
                <h3 className="text-wc-dark font-bold text-xl">{t("profile.basicInfo")}</h3>
              </div>
              <div className="flex flex-col gap-6">
                {basicInfoItems.map(({ icon, title, subtitle }, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-wc-bg flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-wc-dark text-sm font-bold leading-snug">{title}</span>
                      <span className="text-wc-gray text-xs font-normal">{subtitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={{
          full_name: data?.full_name || "",
          location: data?.location,
          bio: data?.bio,
          japanese_level: data?.japanese_level,
          job_title: data?.job_title,
          education: data?.education,
          relationship_status: data?.relationship_status,
          gender: data?.gender,
          date_of_birth: data?.date_of_birth,
          phone_number: data?.phone_number,
        }}
      />

      <EditHobbiesModal
        isOpen={isEditHobbiesOpen}
        onClose={() => setIsEditHobbiesOpen(false)}
        selectedHobbyIds={data?.hobbies?.map(h => h.hobby_id) || []}
      />
    </div>
  );
}
