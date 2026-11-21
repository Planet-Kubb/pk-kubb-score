import gzip,sys
def tuples(line):
    """Yield tuples of values from a MySQL extended INSERT line (bytes)."""
    i=line.index(b' VALUES ')+8; n=len(line)
    while i<n:
        if line[i:i+1]!=b'(': i+=1; continue
        i+=1; row=[]
        while True:
            c=line[i:i+1]
            if c==b"'":
                i+=1; buf=bytearray()
                while True:
                    ch=line[i]
                    if ch==92: buf.append({48:0,110:10,114:13,116:9,90:26}.get(line[i+1],line[i+1])); i+=2
                    elif ch==39: i+=1; break
                    else: buf.append(ch); i+=1
                row.append(bytes(buf))
            else:
                j=i
                while line[j:j+1] not in (b',',b')'): j+=1
                v=line[i:j]; row.append(None if v==b'NULL' else v.decode()); i=j
            if line[i:i+1]==b',': i+=1; continue
            if line[i:i+1]==b')': i+=1; break
        yield row
def schema_and_rows(path,table):
    cols=[];inc=False
    for line in gzip.open(path):
        if line.startswith(b'CREATE TABLE `%s`'%table.encode()): inc=True; continue
        if inc:
            if line.strip().startswith(b'`'): cols.append(line.split(b'`')[1].decode())
            else: inc=False
        if line.startswith(b'INSERT INTO `%s`'%table.encode()):
            for r in tuples(line): yield cols,r
