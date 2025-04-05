import { Accordion, AccordionItem } from "@heroui/accordion";

import EnrolleeDetails from "@/components/enrollee-details";
import BenefitDataTable from "@/components/benefits/benefit-list";
import BenefitDefault from "@/components/benefits/benefit-default";
import Logout from "@/components/logout";

export default function BenefitsPage() {
  return (
    <div className="flex flex-col gap-4 p-6 font-inter">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <img src="/leadway-logo.png" alt="Leadway" className="w-48 mx-auto" />
        </div>

        <EnrolleeDetails />

        <div className="bg-white p-4 rounded-lg max-w-[88rem] mx-auto">
          <Accordion
            selectionMode="multiple"
            variant="shadow"
            defaultExpandedKeys={["1"]}
          >
            <AccordionItem
              key="1"
              aria-label="Benefit list"
              title="Benefit list"
            >
              <BenefitDefault />
            </AccordionItem>
            <AccordionItem
              key="2"
              aria-label="Other Benefits"
              title="Other Benefits"
            >
              <BenefitDataTable />
            </AccordionItem>
          </Accordion>
        </div>

        <Logout />
      </div>
    </div>
  );
}
