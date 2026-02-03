import server from './server'
import colors from 'colors'

server.listen(4000, () => {
    console.log(colors.bgRed.white('REST API en el puerto 4000'))
})
