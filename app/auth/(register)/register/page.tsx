"use client";
import Image from "next/image";
import RegForm from "./reg-form";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useState } from "react";

/* Adicionar declarações padrão para as variáveis usadas nos slides se elas não existirem no projeto */
const slider1 = "/digital-marketing-overview.png";
const slider2 = "/digital-marketing-overview.png";
const slider3 = "/digital-marketing-overview.png";

const RegisterPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar a exibição do modal

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div className="bg-background flex items-center min-h-screen h-full overflow-hidden w-full">
      <div className="lg-inner-column grid  grid-cols-2 w-full  justify-center overflow-y-auto p-4">
        <div
          className="col-span-1 h-full w-full  bg-no-repeat bg-center bg-cover hidden lg:block rounded-xl"
          style={{ backgroundImage: `url("/digital-marketing-overview.png")` }}
        >
          <Swiper
            navigation={{
              prevEl: ".prev",
              nextEl: ".next",
            }}
            pagination={{
              clickable: true,
            }}
            loop={true}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            className="w-full h-full rounded-2xl auth-swiper"
            style={{
              "--swiper-pagination-color": "#fff",
              "--swiper-pagination-bottom": "40px",
              "--swiper-pagination-bullet-size": "10px",
            } as React.CSSProperties}
            key="swiper"
            dir="ltr"
          >
            <SwiperSlide>
              <div className="w-full h-full flex justify-center items-center">
                <Image src={slider1} alt="imagem" className="" priority={true} width={600} height={400} />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="w-full h-full flex justify-center items-center">
                <Image src={slider2} alt="imagem" className="" priority={true} width={600} height={400} />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="w-full h-full flex justify-center items-center">
                <Image src={slider3} alt="imagem" className="" priority={true} width={600} height={400} />
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
        <div className="px-4 py-4 flex justify-center items-center col-span-2 lg:col-span-1">
          <div className="sm:w-[480px] w-full">
            <RegForm />
          </div>
        </div>
      </div>

    </div>
  );
};

export default RegisterPage;
