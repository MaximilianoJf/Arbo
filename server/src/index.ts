import app, { connectDB } from "./server";
import colors from "colors";

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(colors.magenta.bold(`Server running on port: ${PORT}`));
    });
});
