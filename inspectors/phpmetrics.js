module.exports = function PHPMetrics() {
    this.setup = () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve()
            }, 2000)
        })
    }

    this.inspect = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({data: 1})
            }, 1000)
        })
    }

    return this;
}