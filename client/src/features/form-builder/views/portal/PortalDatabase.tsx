import { FormRelationsView } from "../FormRelationsView";

// Renders the full BD relations canvas inside the portal.
// FormRelationsView reads useParams({ id }) which matches the /p/:id route segment.
export const PortalDatabase = () => <FormRelationsView />;
