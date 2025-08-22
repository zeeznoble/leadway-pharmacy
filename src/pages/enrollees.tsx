import { Input } from "@heroui/input";

import EnrolleeDataTable from "@/components/enrollee-table";

import { useEnrolleeSearch } from "@/lib/hooks/use-enrollee-search";

export default function EnrolleesPage() {
  const { searchCriteria, handleChange, handleBlur, validation } =
    useEnrolleeSearch();

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Input
          label="Enrollee ID"
          placeholder="Enter Enrollee ID (e.g. 2400135/0)"
          value={searchCriteria.enrolleeId}
          name="enrolleeId"
          radius="sm"
          onChange={handleChange}
          onBlur={handleBlur}
          isInvalid={validation.enrolleeId.isInvalid}
          errorMessage={validation.enrolleeId.errorMessage}
          isDisabled={false}
        />

        <Input
          label="First Name"
          placeholder="Enter first name"
          value={searchCriteria.firstName}
          name="firstName"
          radius="sm"
          onChange={handleChange}
          onBlur={handleBlur}
          isInvalid={validation.firstName.isInvalid}
          errorMessage={validation.firstName.errorMessage}
          isDisabled={false}
        />

        <Input
          label="Last Name"
          placeholder="Enter last name"
          value={searchCriteria.lastName}
          name="lastName"
          radius="sm"
          onChange={handleChange}
          onBlur={handleBlur}
          isInvalid={validation.lastName.isInvalid}
          errorMessage={validation.lastName.errorMessage}
          isDisabled={false}
        />

        <Input
          label="Mobile Number"
          placeholder="Enter mobile number"
          value={searchCriteria.mobileNo}
          name="mobileNo"
          radius="sm"
          onChange={handleChange}
          onBlur={handleBlur}
          isInvalid={validation.mobileNo.isInvalid}
          errorMessage={validation.mobileNo.errorMessage}
          isDisabled={false}
        />

        <Input
          label="Email"
          placeholder="Enter email address"
          value={searchCriteria.email}
          name="email"
          type="email"
          radius="sm"
          onChange={handleChange}
          onBlur={handleBlur}
          isInvalid={validation.email.isInvalid}
          errorMessage={validation.email.errorMessage}
          isDisabled={false}
        />
      </div>
      <EnrolleeDataTable />
    </section>
  );
}
