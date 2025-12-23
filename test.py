def omega():
    print("Running omega")
    return []

def beta():
    result = []
    result.append("beta result")
    return result

def gamma():
    result = omega()
    result.append("gamma result")
    return result

def alpha():
    x0 = beta()
    x1 = gamma()
    x1.append("alpha result")
    print(x0, x1)